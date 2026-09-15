import { ButtonHTMLAttributes, forwardRef } from 'react';
import { theme } from '../config/theme';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', fullWidth = false, className = '', children, ...props }, ref) => {
    const buttonConfig = theme.button[variant];
    const sizeConfig = size === 'small' ? theme.button.small : size === 'large' ? theme.button.large : {};

    const baseStyles = {
      fontFamily: buttonConfig.fontFamily,
      fontSize: sizeConfig.fontSize || buttonConfig.fontSize,
      fontWeight: buttonConfig.fontWeight,
      padding: sizeConfig.padding || buttonConfig.padding,
      borderRadius: buttonConfig.borderRadius,
      border: buttonConfig.border,
      transition: buttonConfig.transition,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      width: fullWidth ? '100%' : 'auto',
    };

    const colorStyles = {
      backgroundColor: buttonConfig.backgroundColor,
      color: buttonConfig.color,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = buttonConfig.hoverBackgroundColor;
      if (variant === 'outline' && buttonConfig.hoverColor) {
        e.currentTarget.style.color = buttonConfig.hoverColor;
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = buttonConfig.backgroundColor;
      e.currentTarget.style.color = buttonConfig.color;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = buttonConfig.activeBackgroundColor;
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = buttonConfig.hoverBackgroundColor;
    };

    return (
      <button
        ref={ref}
        style={{ ...baseStyles, ...colorStyles }}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
