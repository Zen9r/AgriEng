//app/register/page.tsx


"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [appliedRole, setAppliedRole] = useState("")
  // --- [STEP 1] Add new fields to the state ---
  const [formData, setFormData] = useState({
    email: "", password: "", fullName: "", studentId: "",
    college: "", major: "", phoneNumber: "", self_introduction: "", joiningReason: "",
    skills: "", previous_experience: "", // <-- تمت إضافة هذين الحقلين
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.fullName || !formData.studentId || !formData.college || !formData.major || !formData.phoneNumber) {
        setError("يرجى ملء جميع الحقول الإجبارية (*)");
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (!formData.self_introduction || !formData.joiningReason) {
        setError("يرجى ملء جميع الحقول الإجبارية (*)");
        return;
      }
      setError(null);
      setStep(3);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate step 3 fields
    if (!formData.skills || !formData.previous_experience || !appliedRole) {
      setError("يرجى ملء جميع الحقول الإجبارية (*)");
      return;
    }
    
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("لم يتم إنشاء المستخدم، يرجى المحاولة مرة أخرى.");
      
      const userId = authData.user.id;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: formData.fullName,
        student_id: formData.studentId,
        college: formData.college,
        major: formData.major,
        phone_number: formData.phoneNumber,
        club_role: 'member',
      });

      if (profileError) throw profileError;
      
      // --- [STEP 3] Send the new fields to the database ---
      const { error: applicationError } = await supabase.from("club_applications").insert({
        user_id: userId,
        self_introduction: formData.self_introduction,
        joining_reason: formData.joiningReason,
        skills: formData.skills, // <-- تمت إضافة هذا السطر
        previous_experience: formData.previous_experience, // <-- تمت إضافة هذا السطر
        applied_role: appliedRole,
      });
      
      if (applicationError) throw applicationError;

      alert("تم إنشاء حسابك بنجاح! سيتم توجيهك لصفحة تسجيل الدخول.");
      router.push("/login");

    } catch (error: any) {
      setError(error.message || "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen animated-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-green-700">طلب الانضمام إلى النادي</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? "الخطوة 1 من 3: المعلومات الأساسية" : step === 2 ? "الخطوة 2 من 3: عرفنا عنك" : "الخطوة 3 من 3: مهاراتك ونوع العضوية"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><Label htmlFor="fullName">الاسم الكامل *</Label><Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
                    <div><Label htmlFor="studentId">الرقم الجامعي *</Label><Input id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required /></div>
                    <div><Label htmlFor="phoneNumber">رقم الجوال *</Label><Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required /></div>
                    <div><Label htmlFor="college">الكلية *</Label><Input id="college" name="college" value={formData.college} onChange={handleChange} required /></div>
                    <div><Label htmlFor="major">التخصص *</Label><Input id="major" name="major" value={formData.major} onChange={handleChange} required /></div>
                </div>
                <div className="border-t pt-4 space-y-4"><h3 className="font-semibold">معلومات الحساب</h3><div><Label htmlFor="email">البريد الجامعي *</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="force-ltr" /></div><div><Label htmlFor="password">كلمة المرور * (6 أحرف على الأقل)</Label><Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required /></div></div>
                <Button type="button" onClick={handleNextStep} className="w-full bg-green-600 hover:bg-green-700 text-white">التالي</Button>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="self_introduction" className="text-base font-medium">* عرفنا عن نفسك</Label>
                    <p className="text-sm text-gray-600 mt-1">اكتب نبذة بسيطة عن نفسك، اهتماماتك، وأهدافك</p>
                  </div>
                  <Textarea 
                    id="self_introduction" 
                    name="self_introduction" 
                    value={formData.self_introduction} 
                    onChange={handleChange}
                    placeholder="اكتب نبذة عن نفسك هنا..."
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="joiningReason" className="text-base font-medium">* لماذا ترغب بالانضمام تحديداً لنادينا؟</Label>
                    <p className="text-sm text-gray-600 mt-1">اشرح دوافعك وأسباب رغبتك في الانضمام لنادي الهندسة الزراعية</p>
                  </div>
                  <Textarea 
                    id="joiningReason" 
                    name="joiningReason" 
                    value={formData.joiningReason} 
                    onChange={handleChange}
                    placeholder="اكتب أسباب رغبتك في الانضمام هنا..."
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setError(null); setStep(1); }} className="w-full">السابق</Button>
                  <Button type="button" onClick={handleNextStep} className="w-full bg-green-600 hover:bg-green-700 text-white">التالي</Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="skills" className="text-base font-medium">* ما هي المهارات التي تتقنها؟</Label>
                    <p className="text-sm text-gray-600 mt-1">لكل عضو ميزة خاصة أو مهارة يقدر يساهم فيها مع النادي. اكتب ما تتقنه أو تستطيع تقديمه (مثل: تصميم، كتابة، تنظيم، تصوير، إلقاء، علاقات، أو أي مهارة أخرى)</p>
                  </div>
                  <Textarea 
                    id="skills" 
                    name="skills" 
                    value={formData.skills} 
                    onChange={handleChange}
                    placeholder="اكتب مهاراتك هنا..."
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="previous_experience" className="text-base font-medium">* هل لديك خبرات سابقة في الأندية الطلابية؟</Label>
                    <p className="text-sm text-gray-600 mt-1">اشرح خبراتك السابقة في الأندية أو الأنشطة الطلابية إن وجدت</p>
                  </div>
                  <Textarea 
                    id="previous_experience" 
                    name="previous_experience" 
                    value={formData.previous_experience} 
                    onChange={handleChange}
                    placeholder="اكتب خبراتك السابقة هنا..."
                    required
                  />
                </div>

                {/* Membership Role Selection */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-base font-medium">* نوع العضوية المطلوبة</Label>
                    <p className="text-sm text-gray-600 mt-1">اختر نوع العضوية التي تناسبك في النادي، علماً أن جميع الأعضاء يساهمون في أنشطة وفعاليات النادي وفقا لقدراتهم</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-blue-900">عضو إداري</p>
                          <p className="text-sm text-blue-700">يشارك في إدارة النادي أو قيادة أحد الفرق، ويتحمل مسؤوليات تنظيمية وإدارية، ويحصل على ساعات معتمدة تقديراً لجهوده</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-green-900">عضو فعال</p>
                          <p className="text-sm text-green-700">يشارك بانتظام في الفعاليات والأنشطة المختلفة داخل النادي، ويسند إليه مهام حسب الحاجة، ويحصل على ساعات معتمدة</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-orange-900">متطوع/ة</p>
                          <p className="text-sm text-orange-700">يساهم في دعم وتنفيذ الفعاليات بشكل مرن عند الحاجة، مع منحه ساعات معتمدة مقابل مشاركته</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <RadioGroup value={appliedRole} onValueChange={setAppliedRole} className="space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="عضو إداري" id="admin" required />
                      <Label htmlFor="admin" className="text-sm font-medium">عضو إداري</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="عضو فعال" id="active" required />
                      <Label htmlFor="active" className="text-sm font-medium">عضو فعال</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="متطوع/ة" id="volunteer" required />
                      <Label htmlFor="volunteer" className="text-sm font-medium">متطوع/ة</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setError(null); setStep(2); }} className="w-full">السابق</Button>
                  <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">{loading ? "جارٍ الإرسال..." : "إنهاء التسجيل"}</Button>
                </div>
              </div>
            )}
          </form>
          <div className="mt-6 space-y-4">
            <Link href="/" className="w-full block">
                <Button variant="secondary" className="w-full">
                    <ArrowRight className="h-4 w-4 ml-2" />
                    العودة إلى الصفحة الرئيسية
                </Button>
            </Link>
            <div className="text-center text-sm">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="underline text-blue-600 hover:text-blue-800">
                  تسجيل الدخول
                </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}