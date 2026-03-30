import { useState } from "react";
import faq from "../../data/faq";
import SectionTitle from "../layout/SectionTitle";
import FaqItem from "../ui/FaqItem";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <SectionTitle
        eyebrow="FAQ"
        title="Answers to"
        accent="common questions"
        subtitle="Use this section to reduce friction, set expectations, and make the online experience feel clear before the first consultation."
      />

      <div className="mt-10 grid gap-4">
        {faq.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            open={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
          />
        ))}
      </div>
    </section>
  );
}