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
  /**
   * Opens the cash drawer by sending ESC/POS commands through the printer
   * This works by embedding the drawer kick command that will be sent with the next print job
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

      // Remove any existing cash drawer command element first to avoid duplicate IDs
      const existingElement = document.getElementById('cash-drawer-command');
      if (existingElement) {
        existingElement.remove();
      }

      // Create a hidden element in the main document that will be included when window.print() is called
      // This ensures the cash drawer command is sent with the actual invoice print job
      const hiddenElement = document.createElement('div');
      hiddenElement.id = 'cash-drawer-command';
      hiddenElement.style.display = 'none';
      hiddenElement.innerHTML = `<pre>${commandString}</pre>`;
      
      // Add to document body
      document.body.appendChild(hiddenElement);

      // Clean up after printing completes (500ms is sufficient for the print dialog to capture the content)
      setTimeout(() => {
        const element = document.getElementById('cash-drawer-command');
        if (element) {
          element.remove();
        }
      }, 500);

      console.log('Cash drawer command prepared for next print job');
      return true;
    } catch (error) {
      console.error('Failed to prepare cash drawer command:', error);
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
