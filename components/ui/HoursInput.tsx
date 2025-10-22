'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils'; // تأكد من استيراد cn

interface HoursInputProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

export default function HoursInput({
  value,
  onChange,
  placeholder = "اختر عدد الساعات",
  className
}: HoursInputProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customHours, setCustomHours] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // تحديث الحالة الداخلية عند تغير القيمة من الخارج
  useEffect(() => {
    if (value === undefined || value === '') {
      setSelectedOption('');
      setCustomHours('');
      setShowCustomInput(false);
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      // إذا كانت القيمة بين 1 و 10 (ضمن الخيارات المحددة)
      if (numValue >= 1 && numValue <= 10 && Number.isInteger(numValue)) {
        setSelectedOption(numValue.toString());
        setCustomHours('');
        setShowCustomInput(false);
      } else { // إذا كانت القيمة أكبر من 10 أو كسرية
        setSelectedOption('more');
        setCustomHours(numValue.toString()); // احتفظ بالقيمة كما هي في خانة الإدخال
        setShowCustomInput(true);
      }
    }
  }, [value]);

  const handleSelectChange = (selectedValue: string) => {
    setSelectedOption(selectedValue);

    if (selectedValue === 'more') {
      setShowCustomInput(true);
      // **لا تقم بتغيير القيمة هنا مباشرة**، اسمح للمستخدم بالكتابة
      // إذا كان هناك قيمة سابقة في customHours، احتفظ بها
      // إذا لم يكن هناك قيمة، يمكن مسحها أو تركها فارغة ليبدأ المستخدم
      if (customHours === '' || parseFloat(customHours) <= 10) {
        setCustomHours(''); // امسح القيمة إذا كانت فارغة أو أقل من أو تساوي 10
        onChange(''); // أرسل قيمة فارغة مؤقتًا
      }
    } else {
      // إذا اختار المستخدم رقمًا من القائمة
      setShowCustomInput(false);
      setCustomHours(''); // امسح قيمة الإدخال المخصص
      onChange(selectedValue); // أرسل القيمة المختارة
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomHours(inputValue); // قم بتحديث الحالة الداخلية فورًا بما يكتبه المستخدم

    // **التعديل الرئيسي هنا:**
    // لا تقم باستدعاء onChange فوراً مع كل تغيير.
    // يمكن استدعاؤها عند فقدان التركيز (onBlur) أو بعد تأخير بسيط (debounce)
    // لتجنب المشكلة التي وصفتها. سنستخدم onBlur للتبسيط.
  };

  const handleCustomInputBlur = () => {
    // التحقق والتنظيف عند فقدان التركيز
    if (customHours !== '') {
      const numValue = parseFloat(customHours);
      if (isNaN(numValue) || numValue <= 0) {
        // إذا كانت القيمة غير صالحة، امسحها وأرسل قيمة فارغة
        setCustomHours('');
        onChange('');
        // إذا كانت القيمة أقل من أو تساوي 10، أعد التحديد إلى القائمة
        if (!isNaN(numValue) && numValue > 0 && numValue <= 10 && Number.isInteger(numValue)) {
             setSelectedOption(numValue.toString());
             setShowCustomInput(false);
             onChange(numValue); // أرسل القيمة الصحيحة
        }
      } else {
        // إذا كانت القيمة صالحة وأكبر من 10 أو كسرية
        const finalValue = numValue; // يمكن تقريبها هنا إذا أردت .toFixed(1)
        setCustomHours(finalValue.toString());
        onChange(finalValue); // أرسل القيمة النهائية
      }
    } else {
      // إذا كانت الخانة فارغة عند فقدان التركيز
      onChange('');
    }
  };

  return (
    <div className={cn("flex gap-2", className)}> {/* استخدم cn هنا */}
      <Select value={selectedOption} onValueChange={handleSelectChange} dir="rtl">
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((hour) => (
            <SelectItem key={hour} value={hour.toString()}>
              {hour} ساعة
            </SelectItem>
          ))}
          <SelectItem value="more">أكثر...</SelectItem>
        </SelectContent>
      </Select>

      {showCustomInput && (
        <Input
          type="number"
          step="0.5" // السماح بأنصاف الساعات
          min="0.5" // أقل قيمة ممكنة
          max="100" // حد أقصى (يمكن تعديله)
          value={customHours}
          onChange={handleCustomInputChange}
          onBlur={handleCustomInputBlur} // <--- استدعاء onChange هنا
          placeholder="عدد الساعات"
          className="flex-1"
          dir="ltr" // لضمان إدخال الأرقام بشكل صحيح
        />
      )}
    </div>
  );
}