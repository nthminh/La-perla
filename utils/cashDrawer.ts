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
   * This creates a separate print job specifically for the drawer kick command
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

      // Remove any existing iframe to avoid duplicates
      const existingIframe = document.getElementById('cash-drawer-iframe');
      if (existingIframe) {
        existingIframe.remove();
      }

      // Create a hidden iframe with the drawer kick command
      const iframe = document.createElement('iframe');
      iframe.id = 'cash-drawer-iframe';
      iframe.style.display = 'none';
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      // Add iframe to body
      document.body.appendChild(iframe);

      // Wait for iframe to be ready
      await new Promise(resolve => {
        iframe.onload = resolve;
        // Create a minimal HTML document with the ESC/POS command
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { margin: 0; padding: 0; }
                pre { white-space: pre; font-family: monospace; font-size: 12pt; }
              </style>
            </head>
            <body>
              <pre>${commandString}</pre>
            </body>
            </html>
          `);
          iframeDoc.close();
        }
      });

      // Print the iframe (which sends the ESC/POS command to the printer)
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        // Focus the iframe and print
        iframeWindow.focus();
        iframeWindow.print();
      }

      // Clean up after a delay to ensure print job is sent
      setTimeout(() => {
        const element = document.getElementById('cash-drawer-iframe');
        if (element) {
          element.remove();
        }
      }, 1000);

      console.log('Cash drawer command sent via print job');
      return true;
    } catch (error) {
      console.error('Failed to send cash drawer command:', error);
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
