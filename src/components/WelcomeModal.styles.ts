import styled, { keyframes } from 'styled-components'
import { media } from '../theme'

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.94) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 32, 0.55);
  backdrop-filter: blur(2px);
  animation: ${fadeIn} 0.22s ease-out both;
`

export const Card = styled.div`
  width: 100%;
  max-width: 560px;
  background: #f8f9fa;
  border-radius: 16px;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.18);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${scaleIn} 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.1) both;

  ${media.sm} {
    padding: 28px 22px;
    border-radius: 14px;
  }
`

export const LogoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

export const Logo = styled.img`
  width: 100px;
  height: 100px;
  object-fit: contain;
`

export const Wordmark = styled.h1`
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: -0.01em;
  line-height: 1;
`

export const Divider = styled.div`
  width: 120px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    #14b8a6 0%,
    #14b8a6 25%,
    #f59e0b 25%,
    #f59e0b 50%,
    #8b5cf6 50%,
    #8b5cf6 75%,
    #ef4444 75%,
    #ef4444 100%
  );
`

export const Tagline = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #6b7280;
  letter-spacing: 0.02em;
  text-align: center;
`

export const Body = styled.p`
  margin: 28px 0 24px;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.6;
  text-align: center;

  ${media.sm} {
    margin: 22px 0 20px;
  }
`

export const GetStartedButton = styled.button`
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 6px rgba(30, 58, 95, 0.18);

  &:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.25);
  }

  &:active {
    transform: translateY(0);
    filter: brightness(0.98);
  }

  &:focus-visible {
    outline: 2px solid #2d6a9f;
    outline-offset: 2px;
  }
`

export const FooterDivider = styled.hr`
  width: 100%;
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 28px 0 16px;
`

export const FooterText = styled.p`
  margin: 0 0 12px;
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: center;
  line-height: 1.5;
`

export const CoffeeLink = styled.a`
  display: inline-block;
  padding: 6px 16px;
  background: #ffdd00;
  color: #000000;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 20px;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: #f5d300;
    color: #000000;
    text-decoration: none;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #1e3a5f;
    outline-offset: 2px;
  }
`
