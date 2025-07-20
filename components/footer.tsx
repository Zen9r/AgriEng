// components/footer.tsx (الكود المعدّل)
import Image from "next/image"
import { Mail, Phone, MapPin } from "lucide-react" 
import Link from 'next/link' 

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Club Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <Image
                src="/club-logo.png" // تأكد من أن هذا المسار صحيح
                alt="شعار نادي الهندسة الزراعية"
                width={48}
                height={48}
                className="ml-3 object-contain"
              />
              <div>
                {/* تم تعديل اسم النادي */}
                <h3 className="text-xl font-bold">نادي الهندسة الزراعية</h3>
                <p className="text-gray-400 text-sm">كلية علوم الأغذية والزراعة</p>
              </div>
            </div>
            {/* تم تعديل الوصف */}
            <p className="text-gray-300 mb-6 leading-relaxed">
              نادي طلابي متخصص يهدف إلى ربط الدراسة الأكاديمية بالتطبيق العملي في مجال الهندسة الزراعية، عبر المشاريع التقنية والزيارات الميدانية.
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <a href="https://x.com/cfas_ksu_" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:opacity-80 transition-opacity">
                <Image
                  src="/icons8-x-480.png" 
                  alt="شعار منصة إكس"
                  width={24}
                  height={24}
                  className="brightness-0 invert"
                />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">معلومات التواصل</h4>
            <div className="space-y-3">
               {/* تم تعديل لون الأيقونات */}
              <div className="flex items-center text-gray-300">
                <Mail className="w-5 h-5 ml-3 text-secondary" />
                <span className="text-sm">AgriEng.club@ksu.edu.sa</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="w-5 h-5 ml-3 text-secondary" />
                <span className="text-sm">+966 11 467 8451</span>
              </div>
              <div className="flex items-start text-gray-300">
                <MapPin className="w-5 h-5 ml-3 mt-1 text-secondary flex-shrink-0" />
                <span className="text-sm">
                  <a href="https://maps.app.goo.gl/hvgFiMt1RAo3gL4bA" target="_blank" rel="noopener noreferrer" className="hover:underline">كلية علوم الأغذية والزراعة</a>
                  <br />
                  <a href="https://ksu.edu.sa" target="_blank" rel="noopener noreferrer" className="hover:underline">جامعة الملك سعود</a>
                </span>
              </div>
            </div>
          </div> 

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">روابط سريعة</h4>
            <div className="space-y-2">
              {/* تم تعديل ألوان الـ hover */}
              <Link href="/" className="block text-gray-300 hover:text-secondary transition-colors text-sm">
                الرئيسية
              </Link>
              <Link href="/events" className="block text-gray-300 hover:text-secondary transition-colors text-sm">
                الفعاليات
              </Link>
              <Link href="/gallery" className="block text-gray-300 hover:text-secondary transition-colors text-sm">
                معرض الصور
              </Link>
              <Link href="/contact" className="block text-gray-300 hover:text-secondary transition-colors text-sm">
                تواصل معنا
              </Link>
              <Link href="/register" className="block text-gray-300 hover:text-secondary transition-colors text-sm">
                انضم للنادي
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">© تم انشاء الموقع من قبل محمد الجرباء 2025- جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  )
}