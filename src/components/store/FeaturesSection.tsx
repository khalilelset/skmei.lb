import { Shield, Truck, BadgeCheck, CreditCard } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "100% Authentic",
      description: "All watches are genuine SKMEI products with official warranty",
    },
    {
      icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Free Shipping",
      description: "Free delivery across Lebanon on orders over $50",
    },
    {
      icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "1 Year Warranty",
      description: "Official manufacturer warranty on all products",
    },
    {
      icon: <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Secure Payment",
      description: "Cash on delivery or secure online payment options",
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-brand-silver-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-brand-silver"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-red/10 rounded-xl flex items-center justify-center text-brand-red shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-brand-black mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-brand-gray leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
