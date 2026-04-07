import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

function luhnCheck(num) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function detectCardType(num) {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(?:011|5)/.test(d)) return "Discover";
  return "";
}

function formatCardNumber(val) {
  const digits = val.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function parseCC(str) {
  if (!str) return { number: "", expiry: "", cvv: "", name: "" };
  const lines = str.split("\n").map(l => l.trim()).filter(Boolean);
  const obj = { number: "", expiry: "", cvv: "", name: "" };
  for (const line of lines) {
    if (line.toLowerCase().startsWith("card:")) obj.number = line.slice(5).trim();
    else if (line.toLowerCase().startsWith("exp:")) obj.expiry = line.slice(4).trim();
    else if (line.toLowerCase().startsWith("cvv:")) obj.cvv = line.slice(4).trim();
    else if (line.toLowerCase().startsWith("name:")) obj.name = line.slice(5).trim();
  }
  // If nothing parsed, treat whole string as freeform
  if (!obj.number && !obj.expiry && !obj.cvv && !obj.name && str.trim()) {
    obj.number = str.trim();
  }
  return obj;
}

function serializeCC(obj) {
  const parts = [];
  if (obj.number) parts.push("Card: " + obj.number);
  if (obj.expiry) parts.push("Exp: " + obj.expiry);
  if (obj.cvv) parts.push("CVV: " + obj.cvv);
  if (obj.name) parts.push("Name: " + obj.name);
  return parts.join("\n");
}

export default function CreditCardInput({ value, onChange }) {
  const [cc, setCc] = useState({ number: "", expiry: "", cvv: "", name: "" });

  useEffect(() => {
    setCc(parseCC(value));
  }, [value]);

  const update = (field, val) => {
    const next = { ...cc, [field]: val };
    setCc(next);
    onChange(serializeCC(next));
  };

  const rawDigits = cc.number.replace(/\D/g, "");
  const cardType = detectCardType(rawDigits);
  const isValidNumber = rawDigits.length >= 13 && luhnCheck(rawDigits);
  const showNumberStatus = rawDigits.length >= 13;

  const expiryDigits = cc.expiry.replace(/\D/g, "");
  const isValidExpiry = (() => {
    if (expiryDigits.length !== 4) return false;
    const month = parseInt(expiryDigits.slice(0, 2), 10);
    const year = parseInt("20" + expiryDigits.slice(2), 10);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const expDate = new Date(year, month);
    return expDate > now;
  })();
  const showExpiryStatus = expiryDigits.length === 4;

  const cvvDigits = cc.cvv.replace(/\D/g, "");
  const expectedCvvLen = cardType === "Amex" ? 4 : 3;
  const isValidCvv = cvvDigits.length === expectedCvvLen;
  const showCvvStatus = cvvDigits.length >= 3;

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Card Number</Label>
        <div className="relative mt-1">
          <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={formatCardNumber(cc.number)}
            onChange={(e) => update("number", e.target.value.replace(/\D/g, "").slice(0, 19))}
            placeholder="0000 0000 0000 0000"
            className="pl-9 pr-20"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {cardType && <span className="text-xs font-medium text-muted-foreground">{cardType}</span>}
            {showNumberStatus && (
              isValidNumber
                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                : <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>
        {showNumberStatus && !isValidNumber && (
          <p className="text-xs text-destructive mt-1">Invalid card number</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Expiration</Label>
          <div className="relative mt-1">
            <Input
              value={formatExpiry(cc.expiry)}
              onChange={(e) => update("expiry", e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="MM/YY"
            />
            {showExpiryStatus && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {isValidExpiry
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <AlertCircle className="w-4 h-4 text-destructive" />}
              </div>
            )}
          </div>
          {showExpiryStatus && !isValidExpiry && (
            <p className="text-xs text-destructive mt-1">Invalid or expired</p>
          )}
        </div>
        <div>
          <Label className="text-xs">CVV</Label>
          <div className="relative mt-1">
            <Input
              value={cc.cvv}
              onChange={(e) => update("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={cardType === "Amex" ? "0000" : "000"}
              type="password"
            />
            {showCvvStatus && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {isValidCvv
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <AlertCircle className="w-4 h-4 text-destructive" />}
              </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs">Cardholder Name</Label>
        <Input
          value={cc.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Name on card"
          className="mt-1"
        />
      </div>
    </div>
  );
}