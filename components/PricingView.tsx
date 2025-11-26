
import React, { useState, useMemo, useEffect } from 'react';
import { PRICING_DATA, STAFF_LIST } from '../constants';
import { Translation } from '../translations';
import { PlusIcon, MinusIcon, ReceiptIcon, XMarkIcon, LaPerlaLogo, ChevronDownIcon, DownloadIcon, LockIcon } from './Icons';
import { saveTransaction } from '../storage';
import { saveToGoogleSheets } from '../googleSheets';
import { TransactionItem, CartItem, ActiveBill } from '../types';

interface PricingViewProps {
  t: Translation;
  // New Props for Multiple Bill Support
  activeBills: ActiveBill[];
  setActiveBills: React.Dispatch<React.SetStateAction<ActiveBill[]>>;
  currentBillId: string;
  setCurrentBillId: (id: string) => void;
  
  isBillOpen: boolean;
  setIsBillOpen: (isOpen: boolean) => void;
  openCategories: Record<string, boolean>;
  setOpenCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  autoDownloadTrigger: boolean;
  onAutoDownloadComplete: () => void;
  isStaffMode: boolean;
  setIsStaffMode: (isStaff: boolean) => void;
}

// Helper to generate unique ID for cart items
const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

// Helper interface for grouped display in Bill
interface GroupedCartItem extends CartItem {
    originalIds: string[]; // Track original IDs for removal/editing
}

const STAFF_PIN = "1234";

export const PricingView: React.FC<PricingViewProps> = ({ 
  t,
  activeBills,
  setActiveBills,
  currentBillId,
  setCurrentBillId,
  isBillOpen,
  setIsBillOpen,
  openCategories,
  setOpenCategories,
  autoDownloadTrigger,
  onAutoDownloadComplete,
  isStaffMode,
  setIsStaffMode
}) => {
  // Local UI state
  const [isSaving, setIsSaving] = useState(false);
  
  // Staff Selection Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [pendingService, setPendingService] = useState<{nameKey: string, price: string} | null>(null);
  
  // Staff Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Changed from single ID to array of IDs to support bulk editing from Bill view
  const [editingIds, setEditingIds] = useState<string[]>([]); 

  // --- DERIVED STATE: CURRENT BILL ---
  const currentBill = useMemo(() => {
      return activeBills.find(b => b.id === currentBillId) || activeBills[0];
  }, [activeBills, currentBillId]);

  // Use convenience variables for the current bill's data
  const cartItems = currentBill?.items || [];
  const customerName = currentBill?.customerName || '';
  const discountPercentage = currentBill?.discountPercentage || 0;

  // --- HELPER TO UPDATE CURRENT BILL ---
  const updateCurrentBill = (updates: Partial<ActiveBill>) => {
      setActiveBills(prev => prev.map(bill => 
          bill.id === currentBillId ? { ...bill, ...updates } : bill
      ));
  };

  // --- NEW BILL MANAGEMENT ---
  const handleAddNewBill = () => {
      const newId = Date.now().toString();
      const newBill: ActiveBill = {
          id: newId,
          customerName: '',
          items: [],
          discountPercentage: 0
      };
      setActiveBills(prev => [...prev, newBill]);
      setCurrentBillId(newId);
  };

  const closeBill = (idToClose: string) => {
      // Don't close if it's the last one, just clear it
      if (activeBills.length === 1) {
          updateCurrentBill({ items: [], customerName: '', discountPercentage: 0 });
          return;
      }

      const newBills = activeBills.filter(b => b.id !== idToClose);
      setActiveBills(newBills);
      
      // If we closed the currently selected bill, select the last available one
      if (currentBillId === idToClose) {
          setCurrentBillId(newBills[newBills.length - 1].id);
      }
  };


  // Function to extract a numeric price from string (e.g. "from $55" -> 55, "$10" -> 10)
  const parsePrice = (priceStr: string): number => {
    // Remove commas if any, then look for the first number
    const match = priceStr.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const handleAddClick = (service: {nameKey: string, price: string}) => {
      if (!isStaffMode) return;
      setPendingService(service);
      setEditingIds([]); // Mode: New Item (No IDs being edited)
      setShowStaffModal(true);
  };

  // Remove the LAST added instance of this service (Undo/Minus behavior)
  const handleMinusClick = (nameKey: string) => {
      if (!isStaffMode) return;
      // Find the index of the last item with this nameKey
      const lastIndex = cartItems.map(item => item.nameKey).lastIndexOf(nameKey);
      
      if (lastIndex !== -1) {
          const newItems = [...cartItems];
          newItems.splice(lastIndex, 1);
          updateCurrentBill({ items: newItems });
          
          if (newItems.length === 0) {
              setIsBillOpen(false);
          }
      }
  };

  // 1. Edit from Main List (Single Item via Chip)
  const handleEditChip = (item: CartItem) => {
      if (!isStaffMode) return;
      setPendingService({ nameKey: item.nameKey, price: item.price.toString() }); 
      setEditingIds([item.id]); // Edit specific single item
      setShowStaffModal(true);
  };

  // 2. Edit from Bill (Grouped Items)
  const handleEditItemStaff = (item: GroupedCartItem) => {
      if (!isStaffMode) return;
      setPendingService({ nameKey: item.nameKey, price: item.price.toString() });
      setEditingIds(item.originalIds); // Edit ALL items in this group
      setShowStaffModal(true);
  };

  const handleStaffSelect = (staffName: string) => {
      if (!pendingService) return;

      if (editingIds.length > 0) {
          // EDIT MODE: Update all items that match the IDs being edited
          const updatedItems = cartItems.map(item => 
              editingIds.includes(item.id) 
                  ? { ...item, staffName: staffName } 
                  : item
          );
          updateCurrentBill({ items: updatedItems });
      } else {
          // ADD MODE: Add new item
          const newItem: CartItem = {
              id: generateUniqueId(),
              nameKey: pendingService.nameKey,
              price: parsePrice(pendingService.price),
              quantity: 1, 
              staffName: staffName
          };
          updateCurrentBill({ items: [...cartItems, newItem] });
      }

      setShowStaffModal(false);
      setPendingService(null);
      setEditingIds([]);
  };

  // Group items for display in the Bill (aggregate same service + same staff)
  const groupedCartItems = useMemo(() => {
      const groups: Record<string, GroupedCartItem> = {};
      
      cartItems.forEach(item => {
          // Key by ServiceName + StaffName
          const key = `${item.nameKey}-${item.staffName || 'Unassigned'}`;
          
          if (!groups[key]) {
              groups[key] = {
                  ...item, // This copies properties from the first item found
                  quantity: 0,
                  originalIds: []
              };
          }
          groups[key].quantity += item.quantity;
          groups[key].originalIds.push(item.id);
      });

      return Object.values(groups);
  }, [cartItems]);

  const handleRemoveGroup = (originalIds: string[]) => {
      if (!isStaffMode) return;
      const newItems = cartItems.filter(item => !originalIds.includes(item.id));
      updateCurrentBill({ items: newItems });
      if (newItems.length <= 0) {
          setIsBillOpen(false);
      }
  };

  const clearCurrentCart = () => {
      updateCurrentBill({ items: [], discountPercentage: 0, customerName: '' });
      setIsBillOpen(false);
  };

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => ({
        ...prev,
        [key]: !prev[key]
    }));
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const discountAmount = (cartTotal * discountPercentage) / 100;
  const finalTotal = cartTotal - discountAmount;

  const cartItemCount = useMemo(() => {
      return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // STAFF LOGIN HANDLER
  const handlePinSubmit = () => {
    if (pinInput === STAFF_PIN) {
        setIsStaffMode(true);
        setShowLoginModal(false);
        setPinInput("");
        setPinError("");
    } else {
        setPinError("Incorrect PIN");
        setPinInput("");
    }
  };

  // GENERATE DYNAMIC SHARE LINK & QR CODE
  const getQrCodeUrl = () => {
      const minifiedItems = groupedCartItems.map(item => ({
          k: item.nameKey,
          p: item.price,
          q: item.quantity,
          s: item.staffName
      }));

      const data = {
          c: customerName,
          d: discountPercentage,
          i: minifiedItems
      };

      const json = JSON.stringify(data);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?receipt=${encoded}`;

      return `https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&size=250&margin=1&ecLevel=L`;
  };

  const handleCompletePayment = async () => {
    if (!isStaffMode) return; 
    setIsSaving(true);
    
    const items: TransactionItem[] = cartItems.map(({ id, ...rest }) => rest);

    const transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: finalTotal,
      items: items,
      discountPercentage: discountPercentage
    };

    saveTransaction(transaction);
    await saveToGoogleSheets(transaction);

    setIsSaving(false);
    
    // Close this bill (remove from tabs)
    closeBill(currentBillId);
    
    // Ensure bill modal is closed
    setIsBillOpen(false);
  };

  const handleDownloadBill = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const items = groupedCartItems;
      const now = new Date();
      
      const width = 1240; 
      const height = 1754; 
      const padding = 80;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // --- HEADER SECTION ---
      ctx.textAlign = 'right';
      ctx.fillStyle = '#555555';
      ctx.font = '22px "Poppins", sans-serif';
      const dateY = padding + 50;
      
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      ctx.fillText(`Date: ${dateStr} ${timeStr}`, width - padding, dateY);

      try {
          const qrUrl = getQrCodeUrl();
          const qrImg = new Image();
          qrImg.crossOrigin = "Anonymous";
          
          await new Promise((resolve, reject) => {
              qrImg.onload = resolve;
              qrImg.onerror = reject;
              qrImg.src = qrUrl;
          });

          const qrSize = 120;
          const qrX = width - padding - qrSize;
          const qrY = dateY + 15;

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          
          ctx.font = '10px "Poppins", sans-serif';
          ctx.fillStyle = '#999999';
          ctx.textAlign = 'center';
          ctx.fillText("Scan to View", qrX + (qrSize/2), qrY + qrSize + 15);

      } catch (e) {
          console.error("Could not load QR code onto receipt", e);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 70px "Playfair Display", serif';
      ctx.fillText("LA PERLA", padding, padding + 50);
      
      ctx.font = '28px "Poppins", sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText("Nails & Beauty", padding, padding + 90);

      const infoStartY = padding + 150;
      const infoLineHeight = 35;
      ctx.fillStyle = '#333333';
      ctx.font = '24px "Poppins", sans-serif';
      ctx.fillText("Shop 10/260 Jersey Rd,", padding, infoStartY);
      ctx.fillText("Plumpton NSW 2761", padding, infoStartY + infoLineHeight);
      ctx.fillText("Tel: (02) 9625 8194", padding, infoStartY + (infoLineHeight * 2));

      if (customerName) {
          ctx.textAlign = 'center';
          ctx.font = 'bold 36px "Poppins", sans-serif';
          ctx.fillStyle = '#333333';
          ctx.fillText(customerName.toUpperCase(), width / 2, 335);
      }

      let currentY = 360; 

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();

      currentY += 50;

      ctx.font = 'bold 24px "Poppins", sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText("DESCRIPTION", padding, currentY);
      ctx.textAlign = 'right';
      ctx.fillText("AMOUNT", width - padding, currentY);
      
      currentY += 30;

      ctx.font = '24px "Poppins", sans-serif';
      const rowHeight = 60;
      
      items.forEach((item, index) => {
          if (index % 2 !== 0) {
              ctx.fillStyle = '#f7f7f7';
              ctx.fillRect(padding - 10, currentY, width - (padding * 2) + 20, rowHeight);
          }

          ctx.textAlign = 'left';
          const serviceName = t.serviceNames[item.nameKey] || item.nameKey;
          const staffText = item.staffName ? ` (${item.staffName})` : '';
          const quantityText = item.quantity > 1 ? ` x${item.quantity}` : '';
          
          let displayName = `${serviceName}${staffText}${quantityText}`;
          if (displayName.length > 70) displayName = displayName.substring(0, 67) + '...';

          ctx.fillStyle = '#333333';
          ctx.fillText(displayName, padding, currentY + 40);
          
          ctx.textAlign = 'right';
          const totalItemPrice = (item.price * item.quantity).toFixed(2);
          ctx.fillText(`$${totalItemPrice}`, width - padding, currentY + 40);
          
          currentY += rowHeight;
      });

      currentY += 20;
      
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      currentY += 60;

      ctx.font = '24px "Poppins", sans-serif';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'left';
      ctx.fillText("Subtotal", width - 650, currentY); 
      ctx.textAlign = 'right';
      ctx.fillText(`$${cartTotal.toFixed(2)}`, width - padding, currentY);

      if (discountAmount > 0) {
          currentY += 50;
          ctx.font = 'bold 26px "Poppins", sans-serif';
          ctx.fillStyle = '#DC2626';
          ctx.textAlign = 'left';
          ctx.fillText(`Discount (${discountPercentage}%)`, width - 650, currentY);
          ctx.textAlign = 'right';
          ctx.fillText(`-$${discountAmount.toFixed(2)}`, width - padding, currentY);
      }

      currentY += 50; 
      
      const totalBoxHeight = 100;
      ctx.fillStyle = '#F8F6F2';
      ctx.fillRect(width - 500, currentY, 500, totalBoxHeight);

      const textY = currentY + (totalBoxHeight / 2) + 12;

      ctx.font = 'bold 40px "Poppins", sans-serif'; 
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText("Total", width - 460, textY);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = '#000000';
      ctx.fillText(`$${finalTotal.toFixed(2)}`, width - padding - 20, textY);

      const footerY = height - 100;
      ctx.font = 'italic 20px "Poppins", sans-serif';
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'center';
      ctx.fillText("Thank you for visiting La Perla!", width / 2, footerY);

      const safeName = customerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
      const filename = `${safeName}_${timestamp}.png`;

      const imageUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  useEffect(() => {
    if (autoDownloadTrigger) {
        const runDownload = async () => {
             await handleDownloadBill();
             onAutoDownloadComplete();
        };
        runDownload();
    }
  }, [autoDownloadTrigger]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex justify-between items-center mb-4">
          <div className="flex-1"></div>
          {/* STAFF MODE TOGGLE BUTTON */}
          <button 
            onClick={() => isStaffMode ? setIsStaffMode(false) : setShowLoginModal(true)}
            className={`p-2 rounded-full transition-colors ${isStaffMode ? 'bg-gold-leaf text-white' : 'text-red-500 hover:text-red-600 bg-red-50'}`}
            title={isStaffMode ? "Exit Staff Mode" : "Staff Access"}
          >
              <LockIcon className="w-6 h-6" />
          </button>
      </div>

      {/* --- MULTIPLE CUSTOMER TABS (Only visible in Staff Mode or if multiple bills exist) --- */}
      {(isStaffMode || activeBills.length > 1) && (
          <div className="flex items-center overflow-x-auto gap-2 mb-6 pb-2 custom-scrollbar no-scrollbar">
              {activeBills.map((bill, index) => {
                  const isActive = bill.id === currentBillId;
                  // Calculate item count for this specific bill
                  const itemCount = bill.items.reduce((s, i) => s + i.quantity, 0);
                  const label = bill.customerName || `Customer ${index + 1}`;

                  return (
                      <div key={bill.id} className="relative group">
                          <button
                            onClick={() => setCurrentBillId(bill.id)}
                            className={`flex flex-col items-start min-w-[120px] px-4 py-2 rounded-xl border transition-all ${
                                isActive 
                                    ? 'bg-gold-leaf text-white border-gold-leaf shadow-md scale-105' 
                                    : 'bg-white text-charcoal border-dusty-rose/30 hover:bg-gray-50'
                            }`}
                          >
                              <span className="font-bold text-sm truncate max-w-[100px]">{label}</span>
                              <span className="text-xs opacity-80">{itemCount} items</span>
                          </button>
                          
                          {/* Close Tab Button (Only for Staff) */}
                          {isStaffMode && (
                              <button
                                onClick={(e) => { e.stopPropagation(); closeBill(bill.id); }}
                                className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10`}
                                title="Close Bill"
                              >
                                  <XMarkIcon className="w-3 h-3" />
                              </button>
                          )}
                      </div>
                  );
              })}
              
              {/* Add New Customer Button */}
              {isStaffMode && (
                  <button
                    onClick={handleAddNewBill}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-dusty-rose text-white rounded-full hover:bg-gold-leaf transition-colors shadow-sm ml-2"
                    title="New Customer"
                  >
                      <PlusIcon className="w-6 h-6" />
                  </button>
              )}
          </div>
      )}
      
      <div className="space-y-4">
        {PRICING_DATA.map((category) => {
          const isOpen = openCategories[category.categoryKey];
          // Count items in this category currently in cart (of the ACTIVE bill)
          const itemsInCategory = cartItems.filter(item => 
              category.services.some(s => s.nameKey === item.nameKey)
          ).length;

          return (
            <div key={category.categoryKey} className="bg-pearl-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gold-leaf/20 overflow-hidden">
              {/* Accordion Header */}
              <button 
                onClick={() => toggleCategory(category.categoryKey)}
                className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/50 transition-colors outline-none"
              >
                <div className="flex items-center">
                  <category.icon className="w-8 h-8 text-gold-leaf mr-4" />
                  <h3 className="text-xl md:text-2xl font-serif text-charcoal text-left">
                      {t.serviceCategories[category.categoryKey]}
                      {itemsInCategory > 0 && !isOpen && (
                          <span className="ml-3 text-sm bg-gold-leaf text-white px-2 py-0.5 rounded-full font-sans align-middle">
                              {itemsInCategory}
                          </span>
                      )}
                  </h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-charcoal/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Accordion Content */}
              {isOpen && (
                  <div className="px-4 pb-4 md:px-6 md:pb-6 animate-fade-in border-t border-dusty-rose/20 pt-2">
                    <ul className="divide-y divide-dusty-rose/50">
                        {category.services.map((service, index) => {
                        const countInCart = cartItems.filter(i => i.nameKey === service.nameKey).length;
                        
                        // Active items specifically for this service row to display chips
                        const activeItemsForService = cartItems.filter(i => i.nameKey === service.nameKey);

                        return (
                            <li key={service.nameKey} className="py-3 font-sans">
                                <div className="flex justify-between items-center">
                                    <div className="flex-grow pr-4">
                                        <span className="text-charcoal/90 block md:inline">{index + 1}. {t.serviceNames[service.nameKey]}</span>
                                        <span className="font-medium text-gold-leaf text-sm md:text-base block md:float-right md:ml-4">{service.price}</span>
                                    </div>
                                    
                                    {/* CONTROLS: Only show Add/Minus buttons if in STAFF MODE */}
                                    {isStaffMode && (
                                        <div className="flex items-center gap-2">
                                            {countInCart > 0 && (
                                                <>
                                                    <button 
                                                        onClick={() => handleMinusClick(service.nameKey)}
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 text-charcoal rounded-full hover:bg-gray-300 transition-colors shadow-sm"
                                                    >
                                                        <MinusIcon className="w-4 h-4" />
                                                    </button>
                                                    <span className="font-bold text-charcoal w-6 text-center">
                                                        {countInCart}
                                                    </span>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleAddClick(service)}
                                                className="w-8 h-8 flex items-center justify-center bg-gold-leaf text-white rounded-full hover:bg-gold-leaf/80 transition-colors shadow-sm"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Active Selection Chips (Mini Detail View) */}
                                {activeItemsForService.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {activeItemsForService.map(item => (
                                            <div 
                                                key={item.id} 
                                                className="inline-flex items-center gap-1 bg-blush-pink/50 border border-dusty-rose/50 rounded-full px-3 py-1 text-sm text-charcoal animate-fade-in"
                                            >
                                                {/* Edit Chip: Only active in Staff Mode */}
                                                <button 
                                                    onClick={() => handleEditChip(item)}
                                                    disabled={!isStaffMode}
                                                    className={`font-semibold flex items-center gap-1 ${isStaffMode ? 'hover:text-gold-leaf hover:underline cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    {item.staffName || 'No Staff'} 
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                        })}
                    </ul>
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar - Show if items exist (Staff created or QR loaded) */}
      {cartItemCount > 0 && (
          <div className="fixed bottom-0 left-0 w-full p-4 z-40 animate-slide-up">
              <div className="max-w-3xl mx-auto bg-charcoal text-pearl-white rounded-full shadow-2xl p-3 flex justify-between items-center border border-gold-leaf/30 backdrop-blur-md bg-opacity-95">
                  <div className="flex flex-col px-4">
                      <span className="text-xs text-gold-leaf font-medium uppercase tracking-wider">{customerName || 'Guest'} - {t.total}</span>
                      <span className="text-xl font-bold">${finalTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setIsBillOpen(true)}
                    className="bg-gold-leaf text-white font-sans font-bold py-2 px-6 rounded-full shadow-lg hover:bg-white hover:text-gold-leaf transition-all flex items-center gap-2"
                  >
                      <ReceiptIcon className="w-5 h-5" />
                      {t.viewBill} ({cartItemCount})
                  </button>
              </div>
          </div>
      )}

      {/* Bill Modal */}
      {isBillOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 50 }}>
              <div className="bg-pearl-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Receipt Header */}
                  <div className="bg-blush-pink p-6 text-center border-b border-dusty-rose/30 relative">
                      <button 
                        onClick={() => setIsBillOpen(false)}
                        className="absolute top-4 right-4 text-charcoal/60 hover:text-charcoal transition-colors"
                      >
                          <XMarkIcon className="w-6 h-6" />
                      </button>
                      <div className="w-40 mx-auto mb-2 text-charcoal">
                        <LaPerlaLogo className="w-full h-auto" />
                      </div>
                      <h3 className="text-xl font-serif text-charcoal font-bold uppercase tracking-widest">
                          {customerName ? `${customerName}'s Bill` : t.billTitle}
                      </h3>
                      
                      {/* Customer Name Input - ReadOnly if View Mode */}
                      <div className="mt-3">
                          {isStaffMode ? (
                              <input 
                                type="text" 
                                placeholder="Customer Name (Optional)" 
                                value={customerName}
                                onChange={(e) => updateCurrentBill({ customerName: e.target.value })}
                                className="text-center bg-white/50 border border-dusty-rose/50 rounded-lg px-3 py-1.5 text-sm w-3/4 focus:outline-none focus:ring-1 focus:ring-gold-leaf placeholder-gray-500 text-charcoal"
                              />
                          ) : (
                              customerName && <p className="font-bold text-lg font-sans">{customerName}</p>
                          )}
                      </div>
                      <p className="text-sm text-charcoal/60 font-sans mt-2">{t.billDate}: {new Date().toLocaleDateString()}</p>
                  </div>

                  {/* Receipt Items */}
                  <div className="p-6 overflow-y-auto font-mono text-sm text-charcoal flex-grow bg-white">
                      <div className="border-b-2 border-dashed border-charcoal/20 pb-2 mb-4 flex font-bold text-xs uppercase tracking-wider">
                          <span className="flex-grow">{t.item}</span>
                          <span className="w-12 text-center">{t.qty}</span>
                          <span className="w-20 text-right">{t.price}</span>
                          {isStaffMode && <span className="w-8"></span>}
                      </div>
                      
                      <ul className="space-y-3">
                          {groupedCartItems.map(item => (
                                  <li key={`${item.nameKey}-${item.staffName}`} className="flex items-start group">
                                      {/* Only allow edit click if Staff Mode */}
                                      <div 
                                        className={`flex-grow pr-2 ${isStaffMode ? 'cursor-pointer' : 'cursor-default'}`} 
                                        onClick={() => isStaffMode && handleEditItemStaff(item)}
                                      >
                                          <p className={`font-semibold ${isStaffMode ? 'group-hover:text-gold-leaf' : ''} transition-colors`}>{t.serviceNames[item.nameKey]}</p>
                                          {item.staffName && (
                                              <p className="text-xs text-charcoal/60 italic flex items-center gap-1">
                                                  Stylist: {item.staffName} 
                                                  {isStaffMode && <span className="opacity-0 group-hover:opacity-100 text-gold-leaf text-[10px] bg-gold-leaf/10 px-1 rounded">EDIT</span>}
                                              </p>
                                          )}
                                      </div>
                                      <div className="w-12 text-center pt-1 font-bold">x{item.quantity}</div>
                                      <div className="w-20 text-right font-bold pt-1">${(item.price * item.quantity).toFixed(2)}</div>
                                      
                                      {/* Only show Remove button if Staff Mode */}
                                      {isStaffMode && (
                                          <button 
                                            onClick={() => handleRemoveGroup(item.originalIds)}
                                            className="w-8 flex justify-end text-gray-400 hover:text-red-500 pt-1"
                                          >
                                              <XMarkIcon className="w-4 h-4" />
                                          </button>
                                      )}
                                  </li>
                              )
                          )}
                      </ul>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-2 text-charcoal/80">
                              <span>{t.subtotal}</span>
                              <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          
                          {/* Discount: Editable in Staff Mode, Static in View Mode */}
                          <div className="flex justify-between items-center mb-4 text-charcoal/80">
                              <span className="flex items-center gap-2">
                                  {t.discountLabel}
                                  {isStaffMode ? (
                                      <select 
                                          value={discountPercentage}
                                          onChange={(e) => updateCurrentBill({ discountPercentage: Number(e.target.value) })}
                                          className="ml-2 p-1 rounded border border-dusty-rose text-sm bg-white outline-none focus:border-gold-leaf"
                                      >
                                          <option value={0}>0%</option>
                                          <option value={5}>5%</option>
                                          <option value={10}>10%</option>
                                          <option value={15}>15%</option>
                                          <option value={20}>20%</option>
                                          <option value={25}>25%</option>
                                          <option value={30}>30%</option>
                                      </select>
                                  ) : (
                                     discountPercentage > 0 && <span className="ml-2 font-bold">({discountPercentage}%)</span>
                                  )}
                              </span>
                              <span className="text-red-500 font-bold">-${discountAmount.toFixed(2)}</span>
                          </div>
                          
                          <div className="border-t-2 border-dashed border-charcoal/20 pt-4">
                              <div className="flex justify-between items-center text-xl font-bold">
                                  <span>{t.total}</span>
                                  <span className="text-2xl">${finalTotal.toFixed(2)}</span>
                              </div>
                          </div>

                          {/* QR CODE SECTION */}
                          <div className="mt-6 flex flex-col items-center border-t border-gray-100 pt-4">
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Scan to Download</p>
                              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                  <img 
                                      src={getQrCodeUrl()} 
                                      alt="Scan for Receipt" 
                                      className="w-32 h-32 object-contain"
                                      loading="lazy"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Receipt Footer */}
                  <div className="bg-pearl-white p-6 border-t border-dusty-rose/30 text-center">
                      <p className="text-sm text-gold-leaf font-bold mb-4">{t.showToCashier}</p>
                      <div className="grid grid-cols-1 gap-3">
                          <button 
                            onClick={handleDownloadBill}
                            className="w-full py-3 rounded-xl border border-charcoal/20 text-charcoal font-medium hover:bg-charcoal hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                              <DownloadIcon className="w-5 h-5" />
                              {t.downloadBill}
                          </button>
                          
                          {/* COMPLETE PAYMENT: Only Show in Staff Mode */}
                          {isStaffMode && (
                              <button 
                                onClick={handleCompletePayment}
                                disabled={isSaving}
                                className="w-full py-3 rounded-xl bg-gold-leaf text-white font-bold shadow-md hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-wait"
                              >
                                  {isSaving ? "Saving..." : t.completePayment}
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Staff Selection Modal - Only accessible in Staff Mode anyway */}
      {showStaffModal && pendingService && isStaffMode && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 100 }}>
            <div className="bg-pearl-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                 <div className="bg-blush-pink p-4 text-center border-b border-dusty-rose/30 relative">
                     <button onClick={() => setShowStaffModal(false)} className="absolute top-4 right-4 text-charcoal/60">
                         <XMarkIcon className="w-6 h-6" />
                     </button>
                     <h3 className="text-lg font-serif font-bold text-charcoal">
                         {editingIds.length > 0 ? "Change Stylist" : "Select Stylist"}
                     </h3>
                     <p className="text-sm text-charcoal/70">{t.serviceNames[pendingService.nameKey]}</p>
                 </div>
                 <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3">
                     {STAFF_LIST.map(staff => (
                         <button
                            key={staff}
                            onClick={() => handleStaffSelect(staff)}
                            className="bg-white border border-dusty-rose/30 py-3 px-2 rounded-xl text-charcoal font-medium hover:bg-gold-leaf hover:text-white transition-colors shadow-sm active:scale-95"
                         >
                             {staff}
                         </button>
                     ))}
                 </div>
            </div>
        </div>
      )}

      {/* STAFF PIN MODAL */}
      {showLoginModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 100 }}>
              <div className="bg-pearl-white w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
                  <h3 className="text-xl font-serif font-bold text-charcoal mb-4">Staff Access</h3>
                  <input 
                      type="password" 
                      placeholder="Enter PIN" 
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full p-3 text-center text-xl tracking-widest border border-dusty-rose/50 rounded-xl mb-4 focus:ring-2 focus:ring-gold-leaf outline-none"
                      autoFocus
                  />
                  {pinError && <p className="text-red-500 text-sm mb-4">{pinError}</p>}
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { setShowLoginModal(false); setPinInput(""); setPinError(""); }}
                        className="py-2 bg-gray-200 rounded-lg text-charcoal font-medium hover:bg-gray-300"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handlePinSubmit}
                        className="py-2 bg-gold-leaf text-white rounded-lg font-bold hover:bg-charcoal transition-colors"
                      >
                          Unlock
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
