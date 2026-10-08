import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { BackendProvider } from './shared-logic/backend-provider';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BackendProvider><App/></BackendProvider></React.StrictMode>);
