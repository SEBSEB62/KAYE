import React from 'react';
import { SubscriptionPlan } from '../types';

interface SubscriptionBannerProps {
  daysRemaining: number;
  plan: SubscriptionPlan;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ daysRemaining, plan }) => {
  const isExpiringSoon = daysRemaining <= 7;
  
  // A trial is a PRO plan expiring soon.
  const isTrial = plan === SubscriptionPlan.PRO && isExpiringSoon;

  let message = '';
  
  if (isTrial) {
      if (daysRemaining > 1) {
        message = `Essai Pro. Il vous reste ${daysRemaining} jours.`;
      } else if (daysRemaining === 1) {
        message = "Dernier jour de votre essai Pro !";
      } else {
        message = "Votre essai Pro expire aujourd'hui.";
      }
  } else {
      if (daysRemaining > 1) {
        message = `Abonnement ${plan} actif. Il vous reste ${daysRemaining} jours.`;
      } else if (daysRemaining === 1) {
        message = `Dernier jour de votre abonnement ${plan} !`;
      } else {
        message = `Votre abonnement ${plan} expire aujourd'hui.`;
      }
  }
  
  return (
    <div className={`fixed top-0 left-0 right-0 p-2 text-white text-center font-semibold text-xs z-40 shadow-lg ${isExpiringSoon ? 'bg-red-800' : 'bg-emerald-800'}`}>
      <p>{message}</p>
    </div>
  );
};

export default React.memo(SubscriptionBanner);
