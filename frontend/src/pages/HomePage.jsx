import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import HowItWorksSection from "../components/sections/HowItWorksSection";
import PricingSection from "../components/sections/PricingSection";
import ServicesSection from "../components/sections/ServicesSection";
import FAQSection from "../components/sections/FAQSection";
import IntakeSection from "../components/sections/IntakeSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#040816] text-white">
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.25),transparent_28%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.10),transparent_24%),linear-gradient(180deg,#09142d_0%,#040816_55%,#030612_100%)]" />
      <Header />
      <main id="top">
        <HeroSection />
        <HowItWorksSection />
        <PricingSection />
        <ServicesSection />
        <FAQSection />
        <IntakeSection />
      </main>
      <Footer />
    </div>
  );
}