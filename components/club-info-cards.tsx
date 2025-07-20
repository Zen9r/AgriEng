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
            تأسس نادي الهندسة الزراعية في عام 2023 كمنصة طلابية متخصصة تهدف إلى ربط المفاهيم الأكاديمية بالواقع العملي في مجال الهندسة الزراعية. نسعى لتمكين الطلاب من خلال توفير فرص فريدة لتطبيق التقنيات الحديثة في الزراعة، من أنظمة الري الذكية إلى الزراعة المستدامة. من خلال مجموعة متنوعة من ورش العمل، الزيارات الميدانية والمشاريع التطبيقية، نبني جسوراً بين الدراسة الجامعية ومتطلبات سوق العمل، ونخلق مجتمعاً مبتكراً يجمع بين الشغف بالزراعة والتميز الهندسي.
          </p>
        </div>
      </div>
    </section>
  )
}