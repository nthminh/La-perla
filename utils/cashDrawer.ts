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
   * This embeds the drawer kick command in the main document so it prints with the invoice
   * This avoids triggering a separate blank print dialog
   */
  static async openDrawer(): Promise<boolean> {
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

      // Remove any existing element to avoid duplicates
      const existingElement = document.getElementById('cash-drawer-command');
      if (existingElement) {
        existingElement.remove();
      }

      // Clear any pending cleanup timeout
      if (this.cleanupTimeoutId !== null) {
        clearTimeout(this.cleanupTimeoutId);
        this.cleanupTimeoutId = null;
      }

      // Create a hidden element in the main document
      const hiddenElement = document.createElement('div');
      hiddenElement.id = 'cash-drawer-command';
      hiddenElement.style.display = 'none';
      hiddenElement.innerHTML = `<pre>${commandString}</pre>`;

      // Add to document body
      document.body.appendChild(hiddenElement);

      // Clean up after a short delay (will be printed with the main document)
      this.cleanupTimeoutId = window.setTimeout(() => {
        const element = document.getElementById('cash-drawer-command');
        if (element) {
          element.remove();
        }
        this.cleanupTimeoutId = null;
      }, 500);

      console.log('Cash drawer command added to document');
      return true;
    } catch (error) {
      console.error('Failed to add cash drawer command:', error);
      // Clean up any leftover element
      const element = document.getElementById('cash-drawer-command');
      if (element) {
        element.remove();
      }
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
 * Opens the cash drawer
 * Convenience function to open the cash drawer
 * 
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const openCashDrawer = async (): Promise<boolean> => {
  return CashDrawerManager.openDrawer();
};
