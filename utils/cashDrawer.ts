/**
 * Cash Drawer Utility
 * 
 * Opens cash drawer via RJ12 port using ESC/POS commands.
 * The cash drawer is typically connected to the receipt printer's RJ12 port.
 * 
 * Standard ESC/POS command to open cash drawer:
 * ESC p m t1 t2 = [27, 112, 0, 25, 250]
 * - ESC (27): Escape character
 * - p (112): Drawer kick command
 * - m (0): Pin 2 or Pin 5 (0 = Pin 2, 1 = Pin 5)
 * - t1 (25): ON time (25ms * 2 = 50ms)
 * - t2 (250): OFF time (250ms * 2 = 500ms)
 */

export class CashDrawerManager {
  private static cleanupTimeoutId: number | null = null;

  /**
   * Opens the cash drawer by sending ESC/POS commands through the printer
   * This embeds the drawer kick command in the printable bill area
   * The command will be sent when the bill is printed
   * 
   * @param targetElementId - ID of the element to embed the cash drawer command in (default: 'printable-bill-area')
   * @returns Promise<boolean> - true if command was successfully embedded, false otherwise
   */
  static async openDrawer(targetElementId: string = 'printable-bill-area'): Promise<boolean> {
    try {
      // ESC/POS command bytes to open drawer
      const ESC = 27;   // Escape
      const p = 112;    // Drawer kick
      const m = 0;      // Pin 2 (most common)
      const t1 = 25;    // ON time (50ms)
      const t2 = 250;   // OFF time (500ms)

      // Create the command sequence
      const drawerCommand = new Uint8Array([ESC, p, m, t1, t2]);
      
      // Convert to string that can be sent to printer
      const commandString = Array.from(drawerCommand)
        .map(byte => String.fromCharCode(byte))
        .join('');

      // Find the target printable area (bill)
      const targetElement = document.getElementById(targetElementId) || 
                           document.querySelector('.printable-bill') as HTMLElement;
      
      if (!targetElement) {
        console.warn('Target printable area not found, trying document body');
        return this.openDrawerFallback();
      }

      // Remove any existing command element
      const existingCommand = targetElement.querySelector('#cash-drawer-command');
      if (existingCommand) {
        existingCommand.remove();
      }

      // Clear any pending cleanup timeout
      if (this.cleanupTimeoutId !== null) {
        clearTimeout(this.cleanupTimeoutId);
        this.cleanupTimeoutId = null;
      }

      // Create the cash drawer command element
      // This needs to be visible to the printer but hidden visually
      // Styling must match the print CSS in index.html (lines 127-140)
      const CASH_DRAWER_STYLES = `
        position: absolute;
        left: -9999px;
        top: 0;
        font-size: 1px;
        line-height: 1px;
        overflow: hidden;
        opacity: 0.01;
        pointer-events: none;
      `;
      
      const commandElement = document.createElement('div');
      commandElement.id = 'cash-drawer-command';
      commandElement.style.cssText = CASH_DRAWER_STYLES;
      commandElement.innerHTML = `<pre style="margin:0;padding:0;font-size:1px;line-height:1px;">${commandString}</pre>`;

      // Insert at the beginning of the bill
      targetElement.insertBefore(commandElement, targetElement.firstChild);

      console.log('Cash drawer command embedded in printable bill');
      return true;
    } catch (error) {
      console.error('Failed to embed cash drawer command:', error);
      return false;
    }
  }

  /**
   * Fallback method to add drawer command to body when printable area not found
   */
  private static openDrawerFallback(): boolean {
    try {
      const ESC = 27, p = 112, m = 0, t1 = 25, t2 = 250;
      const drawerCommand = new Uint8Array([ESC, p, m, t1, t2]);
      const commandString = Array.from(drawerCommand)
        .map(byte => String.fromCharCode(byte))
        .join('');

      const existingElement = document.getElementById('cash-drawer-command-fallback');
      if (existingElement) {
        existingElement.remove();
      }

      const hiddenElement = document.createElement('div');
      hiddenElement.id = 'cash-drawer-command-fallback';
      hiddenElement.style.cssText = 'position:absolute;left:-9999px;font-size:1px;opacity:0.01;';
      hiddenElement.innerHTML = `<pre>${commandString}</pre>`;
      document.body.appendChild(hiddenElement);

      this.cleanupTimeoutId = window.setTimeout(() => {
        const element = document.getElementById('cash-drawer-command-fallback');
        if (element) element.remove();
        this.cleanupTimeoutId = null;
      }, 1000);

      console.log('Cash drawer command added as fallback');
      return true;
    } catch (error) {
      console.error('Fallback cash drawer failed:', error);
      return false;
    }
  }

  /**
   * Alternative method using direct printer communication
   * This requires the Web Serial API which may not be available in all browsers
   */
  static async openDrawerViaSerial(): Promise<boolean> {
    try {
      // Check if Web Serial API is available
      if (!('serial' in navigator)) {
        console.warn('Web Serial API not available. Using print method instead.');
        return this.openDrawer();
      }

      // Request access to serial port (RJ12/USB printer)
      const port = await (navigator as Navigator & { serial: any }).serial.requestPort();
      await port.open({ baudRate: 9600 });

      // ESC/POS command to open drawer
      const drawerCommand = new Uint8Array([27, 112, 0, 25, 250]);
      
      const writer = port.writable.getWriter();
      await writer.write(drawerCommand);
      writer.releaseLock();

      await port.close();
      
      console.log('Cash drawer opened via serial port');
      return true;
    } catch (error) {
      console.error('Failed to open cash drawer via serial:', error);
      return false;
    }
  }
}

/**
 * Opens the cash drawer standalone (without embedding in invoice)
 * Creates a hidden temporary printable element with just the ESC/POS command
 * and triggers a print to send the command to the printer
 * 
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const openCashDrawerStandalone = async (): Promise<boolean> => {
  try {
    // ESC/POS command bytes to open drawer
    const ESC = 27;   // Escape
    const p = 112;    // Drawer kick
    const m = 0;      // Pin 2 (most common)
    const t1 = 25;    // ON time (50ms)
    const t2 = 250;   // OFF time (500ms)

    // Create the command sequence
    const drawerCommand = new Uint8Array([ESC, p, m, t1, t2]);
    
    // Convert to string that can be sent to printer
    const commandString = Array.from(drawerCommand)
      .map(byte => String.fromCharCode(byte))
      .join('');

    // Remove any existing command element
    const existingCommand = document.getElementById('cash-drawer-standalone-command');
    if (existingCommand) {
      existingCommand.remove();
    }

    // Create a hidden printable element with the cash drawer command
    // This element will only be visible during printing
    const commandElement = document.createElement('div');
    commandElement.id = 'cash-drawer-standalone-command';
    commandElement.className = 'printable-cash-drawer-only';
    commandElement.style.cssText = 'display: none;';
    commandElement.innerHTML = `<pre style="margin:0;padding:0;font-size:1px;line-height:1px;">${commandString}</pre>`;

    // Add to document body
    document.body.appendChild(commandElement);

    // Set print mode for cash drawer only
    document.body.setAttribute('data-print-mode', 'cash-drawer');

    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Trigger print to send command to printer
    window.print();

    // Clean up after print
    setTimeout(() => {
      document.body.removeAttribute('data-print-mode');
      const element = document.getElementById('cash-drawer-standalone-command');
      if (element) element.remove();
    }, 500);

    console.log('Standalone cash drawer command sent to printer');
    return true;
  } catch (error) {
    console.error('Failed to open cash drawer standalone:', error);
    return false;
  }
};

/**
 * Opens the cash drawer
 * Convenience function to open the cash drawer
 * 
 * @param targetElementId - Optional ID of the printable bill element to embed the command in
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const openCashDrawer = async (targetElementId?: string): Promise<boolean> => {
  return CashDrawerManager.openDrawer(targetElementId);
};
