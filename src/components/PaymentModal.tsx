import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CreditCard, Lock } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentInfo: PaymentInfo) => void;
    totalAmount: number;
    itemCount: number;
}

export interface PaymentInfo {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    billingAddress: string;
}

/**
 * Simulated payment modal for credit card entry
 * This is for UI demonstration only - no real payment processing
 */
export const PaymentModal = ({
    isOpen,
    onClose,
    onConfirm,
    totalAmount,
    itemCount,
}: PaymentModalProps) => {
    const [paymentInfo, setPaymentInfo] = React.useState<PaymentInfo>({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        billingAddress: "",
    });

    const [errors, setErrors] = React.useState<Partial<PaymentInfo>>({});

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setPaymentInfo({
                cardNumber: "",
                expiryDate: "",
                cvv: "",
                billingAddress: "",
            });
            setErrors({});
        }
    }, [isOpen]);

    // Basic validation
    const validateForm = (): boolean => {
        const newErrors: Partial<PaymentInfo> = {};

        // Card number (16 digits)
        const cardNumberClean = paymentInfo.cardNumber.replace(/\s/g, "");
        if (!cardNumberClean || cardNumberClean.length !== 16 || !/^\d+$/.test(cardNumberClean)) {
            newErrors.cardNumber = "Card number must be 16 digits";
        }

        // Expiry date (MM/YY format)
        if (!paymentInfo.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)) {
            newErrors.expiryDate = "Expiry must be MM/YY format";
        }

        // CVV (3 digits)
        if (!paymentInfo.cvv || paymentInfo.cvv.length !== 3 || !/^\d+$/.test(paymentInfo.cvv)) {
            newErrors.cvv = "CVV must be 3 digits";
        }

        // Billing address
        if (!paymentInfo.billingAddress.trim()) {
            newErrors.billingAddress = "Billing address is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = () => {
        if (validateForm()) {
            onConfirm(paymentInfo);
        }
    };

    // Format card number with spaces
    const handleCardNumberChange = (value: string) => {
        const cleaned = value.replace(/\s/g, "");
        const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
        setPaymentInfo({ ...paymentInfo, cardNumber: formatted });
    };

    // Format expiry date with slash
    const handleExpiryChange = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        let formatted = cleaned;
        if (cleaned.length >= 2) {
            formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
        }
        setPaymentInfo({ ...paymentInfo, expiryDate: formatted });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Payment Information
                    </DialogTitle>
                    <DialogDescription>
                        Simulated payment for {itemCount} item{itemCount === 1 ? "" : "s"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Total Amount Display */}
                    <div className="glass-card p-4 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">
                            ${totalAmount.toFixed(2)}
                        </span>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={paymentInfo.cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            maxLength={19}
                            className={errors.cardNumber ? "border-red-500" : ""}
                        />
                        {errors.cardNumber && (
                            <p className="text-xs text-red-500">{errors.cardNumber}</p>
                        )}
                    </div>

                    {/* Expiry and CVV */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                                id="expiry"
                                placeholder="MM/YY"
                                value={paymentInfo.expiryDate}
                                onChange={(e) => handleExpiryChange(e.target.value)}
                                maxLength={5}
                                className={errors.expiryDate ? "border-red-500" : ""}
                            />
                            {errors.expiryDate && (
                                <p className="text-xs text-red-500">{errors.expiryDate}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                                id="cvv"
                                placeholder="123"
                                type="password"
                                value={paymentInfo.cvv}
                                onChange={(e) =>
                                    setPaymentInfo({
                                        ...paymentInfo,
                                        cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                                    })
                                }
                                maxLength={3}
                                className={errors.cvv ? "border-red-500" : ""}
                            />
                            {errors.cvv && <p className="text-xs text-red-500">{errors.cvv}</p>}
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-2">
                        <Label htmlFor="billingAddress">Billing Address</Label>
                        <Input
                            id="billingAddress"
                            placeholder="123 Main St, City, State, ZIP"
                            value={paymentInfo.billingAddress}
                            onChange={(e) =>
                                setPaymentInfo({ ...paymentInfo, billingAddress: e.target.value })
                            }
                            className={errors.billingAddress ? "border-red-500" : ""}
                        />
                        {errors.billingAddress && (
                            <p className="text-xs text-red-500">{errors.billingAddress}</p>
                        )}
                    </div>

                    {/* Security Note */}
                    <div className="flex items-start gap-2 text-xs text-muted-foreground glass-card p-3 rounded-lg">
                        <Lock className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <p>
                            <strong>Note:</strong> This is a simulated payment for demonstration purposes
                            only. No actual payment will be processed.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button onClick={handleConfirm} className="flex-1 glass-button-primary">
                        Confirm Payment
                    </Button>
                    <Button onClick={onClose} variant="outline" className="flex-1">
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
