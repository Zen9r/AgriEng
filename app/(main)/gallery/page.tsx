// app/gallery/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { X, AlertCircle } from 'lucide-react';
import { useGalleryImages, GalleryImage } from '@/hooks/useGalleryImages';

// Helper Components
function ImageSkeleton() {
    return <Skeleton className="h-64 w-full rounded-lg bg-muted" />;
}

function ErrorDisplay({ message }: { message: string }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center bg-destructive/10 text-destructive p-8 rounded-lg">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">حدث خطأ</h3>
            <p>{message}</p>
        </div>
    );
}

// Static categories for filtering
const allStaticCategories = [
  "كل الفعاليات", "ورش عمل", "ندوات", "معارض", "زيارات", 
  "دورات تدريبية", "اعمال تطوعية", "حفلات", "مبادرات", 
  "مؤتمرات", "رحلات", "مسابقات"
];

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120 }
  },
};

const modalVariants: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] } },
};


export default function GalleryPage() {
  const { data: images = [], isLoading, isError, error } = useGalleryImages();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('كل الفعاليات');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const filteredImages = useMemo(() => {
    if (selectedCategory === 'كل الفعاليات') return images;
    return images.filter(img => img.category === selectedCategory);
  }, [selectedCategory, images]);

  const closeModal = () => setSelectedImage(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = selectedImage ? 'hidden' : 'auto';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [selectedImage]);

  return (
    <main className="bg-background text-foreground">
      {/* Header Section with new theme gradient */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl md:text-5xl font-bold mb-4">
                معرض الصور
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl opacity-90 max-w-2xl mx-auto">
                استعرض لحظات مميزة من فعالياتنا وأنشطتنا المتنوعة
            </motion.p>
        </div>
      </section>

      {/* Filter Tabs Section with new theme */}
      <section className="py-4 bg-background/80 backdrop-blur-sm border-b border-border sticky top-[80px] md:top-[96px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto pb-2 space-x-2 space-x-reverse">
            {allStaticCategories.map((category) => (
                <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                >
                {selectedCategory === category && (
                    <motion.div layoutId="activeFilterPill" className="absolute inset-0 bg-primary rounded-full z-0" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                <span className="relative z-10">{category}</span>
                </motion.button>
            ))}
            </div>
        </div>
      </section>

      {/* Image Grid Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {isLoading ? (
                    Array.from({ length: 12 }).map((_, index) => <ImageSkeleton key={index} />)
                ) : isError ? (
                    <ErrorDisplay message={error?.message || "فشل في تحميل الصور."} />
                ) : filteredImages.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground text-lg">لا توجد صور متاحة لهذا التصنيف.</p>
                    </div>
                ) : (
                    filteredImages.map((image) => (
                        <motion.div
                            key={image.id}
                            variants={itemVariants}
                            className="group cursor-pointer overflow-hidden rounded-lg shadow-md bg-card"
                            onClick={() => setSelectedImage(image)}
                            whileHover={{ scale: 1.03, y: -5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                            {/* 🌟 بداية الإصلاح هنا */}
                            <img 
                                // إذا كان الرابط null، استخدم رابطًا احتياطيًا
                                src={image.image_url ?? "/placeholder.svg"} 
                                // إذا كان النص البديل null، استخدم نصًا افتراضيًا
                                alt={image.alt_text ?? 'صورة من المعرض'} 
                                className="w-full h-64 object-cover" 
                            />
                            {/* 🌟 نهاية الإصلاح هنا */}

                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <h3 className="text-white font-semibold text-sm line-clamp-2">{image.alt_text}</h3>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </div>
      </section>

      {/* Modal for viewing image */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center"
                variants={modalVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
            >
              {/* 🌟 بداية الإصلاح هنا */}
              <img 
                src={selectedImage.image_url ?? "/placeholder.svg"} 
                alt={selectedImage.alt_text ?? 'صورة من المعرض'} 
                className="object-contain rounded-lg w-auto h-auto max-w-full max-h-[calc(90vh-80px)] shadow-2xl"
              />
              {/* 🌟 نهاية الإصلاح هنا */}
              
              <div className="w-full max-w-full text-white mt-4 text-center">
                <h3 className="text-lg font-bold">{selectedImage.alt_text}</h3>
                <div className="flex justify-center items-center gap-4 mt-2 text-sm">
                  <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full">{selectedImage.category}</span>
                  <span className="text-gray-300">{new Date(selectedImage.created_at).toLocaleDateString("ar-SA")}</span>
                </div>
              </div>
            </motion.div>
            
            <motion.button 
              onClick={closeModal} 
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <X className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};
