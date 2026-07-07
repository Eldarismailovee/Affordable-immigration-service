import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import WhoThisIsForSection from "../components/sections/WhoThisIsForSection";
import PreIntakeClaritySection from "../components/sections/PreIntakeClaritySection";
import WhyTrustUsSection from "../components/sections/WhyTrustUsSection";
import HowItWorksSection from "../components/sections/HowItWorksSection";
import PricingSection from "../components/sections/PricingSection";
import ServicesSection from "../components/sections/ServicesSection";
import FAQSection from "../components/sections/FAQSection";
import IntakeSection from "../components/sections/IntakeSection";
import { pageSurfaceClass } from "../constants/themeClasses.js";

export default function HomePage() {
  return (
    <div className={pageSurfaceClass}>
      <Header />
      <main id="main-content">
        <HeroSection />
        <WhoThisIsForSection />
        <PreIntakeClaritySection />
        <WhyTrustUsSection />
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
