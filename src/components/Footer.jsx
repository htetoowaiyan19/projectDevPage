import { FaTelegram, FaDiscord, FaGithub } from 'react-icons/fa'
import './Footer.css'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div className="site-footer__copyright">
          © 2026 HtetOoWaiYan
        </div>
        
        <div className="site-footer__links">
          <a 
            href="https://drive.google.com/file/d/1Ylvpm3-Jexrcm9KhPwDPIf7LtoB90a_6/view?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="site-footer__link"
          >
            Terms and Conditions EN
          </a>
          <a 
            href="https://drive.google.com/file/d/1P6kCTRRKXXAPR4LfAxsDlIkxHH-I0Nz9/view?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="site-footer__link"
          >
            Terms and Conditions MY
          </a>
        </div>
        
        <div className="site-footer__social">
          <a 
            href="https://t.me/kelvinzedaph" 
            target="_blank" 
            rel="noopener noreferrer"
            className="site-footer__social-link"
            aria-label="Telegram"
          >
            <FaTelegram />
          </a>
          <a 
            href="https://discord.gg/ZJBrYBz74D" 
            target="_blank" 
            rel="noopener noreferrer"
            className="site-footer__social-link"
            aria-label="Discord"
          >
            <FaDiscord />
          </a>
          <a 
            href="https://github.com/htetoowaiyan19" 
            target="_blank" 
            rel="noopener noreferrer"
            className="site-footer__social-link"
            aria-label="GitHub"
          >
            <FaGithub />
          </a>
        </div>
      </div>
    </footer>
  )
}