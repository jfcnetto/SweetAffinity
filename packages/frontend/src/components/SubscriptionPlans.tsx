import React from 'react';
import type { Plan } from '../types';

interface SubscriptionPlansProps {
  plans: Plan[];
  onSubscribeClick: (plan: Plan) => void;
}

const CheckIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ plans, onSubscribeClick }) => {
  return (
    <section id="plans" className="py-20 bg-neutral-gray">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-2 font-display text-gray-800">Nossos Planos</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Invista em suas conexões. Escolha o plano ideal para você e tenha acesso a funcionalidades exclusivas.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-lg p-8 shadow-lg flex flex-col relative ${plan.highlight ? 'border-4 border-gradient-pink transform scale-105' : 'border'}`}>
              {plan.highlight && (
                <span className="bg-gradient-to-r from-gradient-pink to-gradient-orange text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-4 self-center">MAIS POPULAR</span>
              )}
              <h3 className="text-3xl font-bold font-display text-center mb-4">{plan.name}</h3>
              <p className="text-4xl font-bold text-center mb-6">{plan.price}</p>
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features?.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => onSubscribeClick(plan)}
                disabled={plan.name === 'Gratuito'}
                className={`w-full py-3 rounded-full font-bold text-lg transition-all duration-300 ${
                  plan.name === 'Gratuito' 
                  ? 'bg-gray-200 text-gray-500 cursor-default' 
                  : plan.highlight 
                    ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange text-white hover:opacity-90' 
                    : 'bg-gray-800 text-white hover:bg-black'
                }`}
              >
                {plan.name === 'Gratuito' ? 'Seu Plano Atual' : 'Assinar Agora'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;