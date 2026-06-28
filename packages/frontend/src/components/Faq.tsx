
import React from 'react';
import type { FaqItem } from '../types';

interface FaqProps {
  items: FaqItem[];
}

const FaqAccordionItem: React.FC<{ item: FaqItem }> = ({ item }) => {
  return (
    <details className="group border-b border-gray-200 py-4">
      <summary className="flex justify-between items-center cursor-pointer list-none">
        <span className="font-semibold text-lg">{item.question}</span>
        <span className="transform transition-transform duration-300 group-open:rotate-45">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </span>
      </summary>
      <p className="mt-4 text-gray-600">{item.answer}</p>
    </details>
  );
};

const Faq: React.FC<FaqProps> = ({ items }) => {
  return (
    <section id="faq" className="py-20 bg-neutral-gray">
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-12 font-display text-gray-800">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <FaqAccordionItem key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
