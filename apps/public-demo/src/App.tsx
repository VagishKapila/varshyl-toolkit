import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage.js';
import { AuthPage } from './pages/AuthPage.js';
import { AuthForgotPage } from './pages/AuthForgotPage.js';
import { AuthResetPage } from './pages/AuthResetPage.js';
import { ConsentSignupPage } from './pages/ConsentSignupPage.js';
import { ConsentWelcomePage } from './pages/ConsentWelcomePage.js';
import { ConsentEmptyPage } from './pages/ConsentEmptyPage.js';
import { PaymentsPaywallPage } from './pages/PaymentsPaywallPage.js';
import { PaymentsLapsedPage } from './pages/PaymentsLapsedPage.js';
import { TeamPeoplePage } from './pages/TeamPeoplePage.js';

export function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/forgot" element={<AuthForgotPage />} />
        <Route path="/auth/reset" element={<AuthResetPage />} />
        <Route path="/consent/signup" element={<ConsentSignupPage />} />
        <Route path="/consent/welcome" element={<ConsentWelcomePage />} />
        <Route path="/consent/empty" element={<ConsentEmptyPage />} />
        <Route path="/payments/paywall" element={<PaymentsPaywallPage />} />
        <Route path="/payments/lapsed" element={<PaymentsLapsedPage />} />
        <Route path="/team/people" element={<TeamPeoplePage />} />
      </Routes>
    </BrowserRouter>
  );
}
