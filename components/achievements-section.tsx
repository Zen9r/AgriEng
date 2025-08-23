// src/components/achievements-section.tsx (الكود الجديد)

import { Briefcase, GraduationCap, MapPin, HeartHandshake } from "lucide-react"

const offerings = [
  {
    icon: <Briefcase className="h-10 w-10 text-blue-500" />,
    title: "ورش عمل",
    description: "ورش عمل متخصصة في مجالات الهندسة المختلفة لتنمية المهارات العملية.",
  },
  {
    icon: <GraduationCap className="h-10 w-10 text-green-500" />,
    title: "دورات تدريبية",
    description: "دورات تدريبية شاملة لتعزيز المعرفة النظرية والعملية للطلاب.",
  },
  {
    icon: <MapPin className="h-10 w-10 text-orange-500" />,
    title: "زيارات ميدانية",
    description: "زيارات ميدانية للمشاريع والشركات الهندسية للتعلم من الخبرات العملية.",
  },
  {
    icon: <HeartHandshake className="h-10 w-10 text-red-500" />,
    title: "اعمال تطوعية",
    description: "مبادرات تطوعية لخدمة المجتمع وتطبيق المعرفة الهندسية في مساعدة الآخرين.",
  },
]

export default function AchievementsSection() {
  return (
    <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            ماذا نقدم ؟
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {offerings.map((item) => (
            <div key={item.title} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center transition-transform duration-300 hover:scale-105">
              <div className="flex items-center justify-center h-20 w-20 mx-auto rounded-full">
                {item.icon}
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}