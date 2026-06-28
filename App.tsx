import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProfileTypes from './components/ProfileTypes';
import HowItWorks from './components/HowItWorks';
import FeaturedProfiles from './components/FeaturedProfiles';
import SubscriptionPlans from './components/SubscriptionPlans';
import BlogPreview from './components/BlogPreview';
import Faq from './components/Faq';
import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import PhotoUpload from './components/PhotoUpload';
import AdvancedSearch from './components/AdvancedSearch';
import VerificationModal from './components/VerificationModal';
import MessageModal from './components/MessageModal';
import PaymentModal from './components/PaymentModal';
import TermsOfUse from './components/TermsOfUse';
import PendingVerification from './components/PendingVerification';
import AdminPage from './components/admin/AdminPage';
import AdminLogin from './components/admin/AdminLogin';


import { SUGAR_BABIES, SUGAR_DADDIES_MOMMIES, PLANS, FAQ_ITEMS, BLOG_ARTICLES } from './constants';
import type { Profile, FilterCriteria, Plan } from './types';

type SeekingPreference = 'Baby' | 'Daddy' | 'Mommy';
type ProfileType = 'Baby' | 'Daddy' | 'Mommy';

const PreferenceSelector: React.FC<{
  selected: SeekingPreference;
  onSelect: (preference: SeekingPreference) => void;
  options: { id: SeekingPreference; label: string }[];
}> = ({ selected, onSelect, options }) => {
  return (
    <div className="bg-neutral-gray py-8">
        <div className="container mx-auto px-6 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-center mb-6 font-display text-gray-800">Quem você está procurando?</h2>
            <div className="flex justify-center bg-white p-2 rounded-full shadow-md space-x-2">
                {options.map((option) => (
                    <button
                    key={option.id}
                    onClick={() => onSelect(option.id)}
                    className={`px-6 py-2 text-sm md:text-base font-semibold rounded-full transition-all duration-300 ${
                        selected === option.id
                        ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    >
                    {option.label}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};


const App: React.FC = () => {
  const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'register' as 'login' | 'register' });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [activeChatProfile, setActiveChatProfile] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  const [currentPage, setCurrentPage] = useState('home');
  const [seekingPreference, setSeekingPreference] = useState<SeekingPreference>('Baby');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({});
  
  const [currentUser, setCurrentUser] = useState<{ profileType: ProfileType, isPremium: boolean } | null>(null);
  const [registrationData, setRegistrationData] = useState<{ profileType: ProfileType } | null>(null);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);


  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); 
  };

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsProfileModalOpen(true);
  };
  
  const handleOpenMessages = (profile: Profile) => {
    setActiveChatProfile(profile);
    setIsMessageModalOpen(true);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthModalState({ isOpen: true, mode });
  };
  
  const handleCloseAuthModal = () => {
    setAuthModalState({ isOpen: false, mode: 'register' });
  };
  
  const handleLoginSuccess = () => {
    // Simulate logging in an existing premium daddy user
    setCurrentUser({ profileType: 'Daddy', isPremium: true });
    setIsLoggedIn(true);
    setSeekingPreference('Baby');
    handleCloseAuthModal();
    navigateTo('home');
  };

  const handleRegistrationSuccess = (profileType: ProfileType) => {
    setRegistrationData({ profileType });
    handleCloseAuthModal();
    setIsUploadingPhotos(true);
  };

  const handleUploadComplete = () => {
    setIsUploadingPhotos(false);
    setIsVerificationModalOpen(true);
  };

  const handleVerificationComplete = () => {
    setIsVerificationModalOpen(false);
    setIsPendingVerification(true);
    navigateTo('home');
  };
  
  const handleAdminApproval = () => {
      setIsPendingVerification(false);
      if (registrationData) {
          const userProfileType = registrationData.profileType;
          const isPremium = userProfileType === 'Baby';
          setCurrentUser({ profileType: userProfileType, isPremium: isPremium });
          if (userProfileType === 'Baby') {
              setSeekingPreference('Daddy');
          } else {
              setSeekingPreference('Baby');
          }
      } else {
          setCurrentUser({ profileType: 'Daddy', isPremium: false });
          setSeekingPreference('Baby');
      }
      setIsLoggedIn(true);
      navigateTo('home');
  }
  
  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    navigateTo('admin-users');
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setRegistrationData(null);
    setIsPendingVerification(false);
    setIsAdminLoggedIn(false);
    setCurrentPage('home');
    setSeekingPreference('Baby');
  }
  
  const handleSubscribeClick = (plan: Plan) => {
    if (plan.name === 'Gratuito') return;
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
      setIsPaymentModalOpen(false);
      if(currentUser) {
          setCurrentUser({ ...currentUser, isPremium: true });
          alert('Pagamento bem-sucedido! Sua conta agora é Premium.');
          navigateTo('home');
      }
  };

  const handleApplyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const allProfiles = useMemo(() => [...SUGAR_BABIES, ...SUGAR_DADDIES_MOMMIES], []);

  const filteredProfiles = useMemo(() => {
    return allProfiles
      .filter(p => p.type === seekingPreference)
      .filter(profile => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value || value === '') return true;

          if (key === 'state') {
              return profile.location.split(', ')[1] === value;
          }
          if (key === 'city') {
              return profile.location.split(', ')[0] === value;
          }

          const profileValue = profile[key as keyof Profile];
          if (profileValue === undefined) return true;
          
          return String(profileValue) === String(value);
        });
      });
  }, [seekingPreference, allProfiles, filters]);


  const renderUserContent = () => {
    const sharedPages: { [key: string]: React.ReactNode } = {
        'plans': <SubscriptionPlans plans={PLANS} onSubscribeClick={handleSubscribeClick} />,
        'blog': <BlogPreview articles={BLOG_ARTICLES} />,
        'faq': <Faq items={FAQ_ITEMS} />,
        'about': <AboutUs />,
        'how-it-works': <HowItWorks />,
        'terms': <TermsOfUse />,
    };

    if (sharedPages[currentPage]) {
        return sharedPages[currentPage];
    }

    if (isUploadingPhotos) {
        return <PhotoUpload onComplete={handleUploadComplete} />;
    }
    
    if (isPendingVerification) {
        return <PendingVerification />;
    }
    
    if (isLoggedIn && currentUser) {
        const isBaby = currentUser.profileType === 'Baby';
        
        const preferenceSelectorOptions = isBaby ?
            [
                { id: 'Daddy' as SeekingPreference, label: 'Sugar Daddies' },
                { id: 'Mommy' as SeekingPreference, label: 'Sugar Mommies' },
            ] : [];

        const sectionTitles: Record<SeekingPreference, string> = {
            Baby: "Sugar Babies para Você",
            Daddy: "Sugar Daddies para Você",
            Mommy: "Sugar Mommies para Você"
        };
        
        return (
            <>
                <AdvancedSearch onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters} />
                {isBaby && (
                    <PreferenceSelector 
                        selected={seekingPreference} 
                        onSelect={setSeekingPreference}
                        options={preferenceSelectorOptions}
                    />
                )}
                <FeaturedProfiles 
                    sectionTitle={sectionTitles[seekingPreference]} 
                    profiles={filteredProfiles} 
                    onProfileClick={handleProfileClick} 
                />
            </>
        );
    } else {
        // Logged-out home page
        return (
            <>
                <Hero onSignUpClick={() => handleOpenAuthModal('register')} />
                <ProfileTypes />
                <HowItWorks />
                <SubscriptionPlans plans={PLANS} onSubscribeClick={handleSubscribeClick} />
            </>
        );
    }
  };

  // --- Admin Login View ---
  if (currentPage === 'admin-login') {
    return (
      <div className="bg-white">
        <Header 
          onSignInClick={() => handleOpenAuthModal('login')} 
          onSignUpClick={() => handleOpenAuthModal('register')} 
          navigateTo={navigateTo} 
          isLoggedIn={false}
          onSignOut={handleSignOut}
          onMessagesClick={() => {}}
          isAdminView={false}
        />
        <main>
          <AdminLogin onLoginSuccess={handleAdminLogin} />
        </main>
        <Footer navigateTo={navigateTo} />
      </div>
    );
  }

  // --- Admin View (Logged In)---
  if (isAdminLoggedIn) {
    return (
      <div className="bg-white">
        <Header 
          navigateTo={navigateTo}
          isLoggedIn={true}
          onSignOut={handleSignOut}
          isAdminView={true}
          onSignInClick={() => {}}
          onSignUpClick={() => {}}
          onMessagesClick={() => {}}
        />
        <main>
          <AdminPage onApproveUser={handleAdminApproval} />
        </main>
        <Footer navigateTo={navigateTo} />
      </div>
    );
  }

  // --- Public & User Views ---
  return (
    <div className="bg-white">
      <Header 
        onSignInClick={() => handleOpenAuthModal('login')} 
        onSignUpClick={() => handleOpenAuthModal('register')} 
        navigateTo={navigateTo} 
        isLoggedIn={isLoggedIn}
        onSignOut={handleSignOut}
        onMessagesClick={() => handleOpenMessages(SUGAR_BABIES[0])}
        isAdminView={false}
      />
      <main>
        {renderUserContent()}
      </main>
      <Footer navigateTo={navigateTo} />
      {authModalState.isOpen && (
        <AuthModal 
          onClose={handleCloseAuthModal} 
          initialMode={authModalState.mode}
          onRegistrationComplete={handleRegistrationSuccess}
          onLoginSuccess={handleLoginSuccess}
          navigateTo={navigateTo}
        />
      )}
      {isProfileModalOpen && selectedProfile && (
          <ProfileModal 
              profile={selectedProfile} 
              onClose={() => setIsProfileModalOpen(false)}
              navigateTo={navigateTo}
              onSendMessage={(profile) => {
                  setIsProfileModalOpen(false);
                  handleOpenMessages(profile);
              }}
          />
      )}
      {isMessageModalOpen && activeChatProfile && currentUser && (
          <MessageModal 
              recipient={activeChatProfile} 
              onClose={() => setIsMessageModalOpen(false)}
              navigateTo={navigateTo}
              isPremiumUser={currentUser.isPremium}
              currentUserType={currentUser.profileType}
          />
      )}
      {isVerificationModalOpen && (
        <VerificationModal
          onClose={() => {
            setIsVerificationModalOpen(false);
            navigateTo('home');
          }}
          onComplete={handleVerificationComplete}
        />
      )}
      {isPaymentModalOpen && selectedPlan && (
        <PaymentModal 
            plan={selectedPlan}
            onClose={() => setIsPaymentModalOpen(false)}
            onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default App;
