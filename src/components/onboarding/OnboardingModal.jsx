import React, { useEffect, useRef } from 'react';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { ChevronLeftIcon, ChevronRightIcon } from '../common/Icons';

const OnboardingModal = () => {
  const inputRef = useRef(null);

  const {
    isOpen,
    hasCompletedOnboarding,
    step,
    displayName,
    hobbies,
    referralSource,
    hobbyOptions,
    referralOptions,
    setDisplayName,
    toggleHobby,
    setReferralSource,
    nextStep,
    prevStep,
    submitOnboarding
  } = useOnboardingStore();

  useEffect(() => {
    if (isOpen && step === 1) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, step]);

  if (!isOpen || hasCompletedOnboarding) return null;

  const isStep1Valid = displayName.trim().length > 0;
  const isStep2Valid = hobbies.length > 0;
  const isStep3Valid = referralSource.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1 && isStep1Valid) {
      nextStep();
    } else if (step === 2 && isStep2Valid) {
      nextStep();
    } else if (step === 3 && isStep3Valid) {
      submitOnboarding();
    }
  };

  return (
    <div 
      className="modal-overlay onboarding-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome Onboarding Modal"
    >
      <div className="modal onboarding-modal">
        {/* Header & Step Indicator */}
        <div className="onboarding-header">
          <div className="onboarding-brand">
            <span className="logo-icon small">A</span>
            <h2>Welcome to ARCH</h2>
          </div>
          <p className="onboarding-subtitle">
            Let's personalize your workspace in just 3 quick steps.
          </p>

          <div className="onboarding-step-indicator" role="navigation" aria-label="Onboarding Steps">
            <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>
              <span>1</span>
              <label>Profile</label>
            </div>
            <div className="step-line" />
            <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>
              <span>2</span>
              <label>Interests</label>
            </div>
            <div className="step-line" />
            <div className={`step-dot ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>
              <span>3</span>
              <label>Discovery</label>
            </div>
          </div>
        </div>

        {/* Step Contents */}
        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="onboarding-body">
            {step === 1 && (
              <div className="onboarding-step-content fade-in">
                <label className="onboarding-label" htmlFor="preferredName">
                  What is your preferred name?
                </label>
                <p className="onboarding-hint">
                  This will be displayed across your ARCH command bar and dashboard.
                </p>
                <input
                  id="preferredName"
                  ref={inputRef}
                  type="text"
                  className="onboarding-input"
                  placeholder="e.g. Alex, Commander, Jordan..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={40}
                  required
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="onboarding-step-content fade-in">
                <label className="onboarding-label">
                  Select your hobbies & interests
                </label>
                <p className="onboarding-hint">
                  Choose all that apply. We'll tailor your quick modules accordingly.
                </p>

                <div className="onboarding-pills-grid" role="group" aria-label="Select Hobbies">
                  {hobbyOptions.map((hobby) => {
                    const isSelected = hobbies.includes(hobby);
                    return (
                      <button
                        type="button"
                        key={hobby}
                        className={`onboarding-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleHobby(hobby)}
                        aria-pressed={isSelected}
                      >
                        <span className="pill-check">{isSelected ? '✓' : '+'}</span>
                        {hobby}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="onboarding-step-content fade-in">
                <label className="onboarding-label">
                  How did you discover ARCH?
                </label>
                <p className="onboarding-hint">
                  Select the source that brought you here.
                </p>

                <div className="onboarding-options-list" role="radiogroup" aria-label="Referral Source">
                  {referralOptions.map((option) => {
                    const isSelected = referralSource === option;
                    return (
                      <div
                        key={option}
                        className={`onboarding-option-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setReferralSource(option)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            setReferralSource(option);
                          }
                        }}
                      >
                        <div className="option-radio-dot">
                          {isSelected && <div className="radio-inner-dot" />}
                        </div>
                        <span className="option-text">{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="onboarding-footer">
            {step > 1 ? (
              <button
                type="button"
                className="btn btn-secondary onboarding-back-btn"
                onClick={prevStep}
              >
                <ChevronLeftIcon size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary onboarding-next-btn"
                onClick={nextStep}
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              >
                Next <ChevronRightIcon size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-success onboarding-submit-btn"
                disabled={!isStep3Valid}
              >
                Get Started 🚀
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingModal;
