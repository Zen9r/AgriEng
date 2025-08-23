// src/components/club-info-cards.tsx (الكود المعدّل)
export default function ClubInfoCards() {
  return (
    <section className="py-12 md:py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            تعرف على نادينا
          </h2>
        </div>
        <div className="mt-8 max-w-3xl mx-auto">
          {/* تم تعديل النص بالكامل */}
          <p className="text-lg text-center leading-relaxed text-gray-700 dark:text-gray-300">
          نادي الهندسة الزراعية هو نادي طلابي لا صفي تأسس في 25/5/1433 هـ بدعم من عمادة شؤون الطلاب بجامعة الملك سعود.
          يهدف النادي إلى تنمية وصقل مهارات طلاب قسم الهندسة الزراعية عبر أنشطة وفعاليات متنوعة تشمل الجوانب العلمية والثقافية والاجتماعية والتطوعية، ليكون منصة تجمع بين التطوير الأكاديمي والتجربة العملية بروح طلابية مميزة.          </p>
        </div>
      </div>
    </section>
  )
}