class EmailValidationService {
  constructor() {
    this.allowedDomains = [
      'gmail.com',
      'outlook.com',
      'hotmail.com' // outlook.com includes hotmail.com
    ];

    this.commonTypos = {
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com', 
      'gmal.com': 'gmail.com',
      'gmail.cm': 'gmail.com',
      'gmail.con': 'gmail.com',
      'outlook.cm': 'outlook.com',
      'outlook.con': 'outlook.com',
      'hotmai.com': 'outlook.com',
      'hotmail.cm': 'outlook.com'
    };
  }

  validateEmail(email) {
    const errors = [];
    const suggestions = [];

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email address format');
      return { isValid: false, errors, suggestions };
    }

    const [localPart, domain] = email.split('@');
    
    // Check for common typos first
    if (this.commonTypos[domain]) {
      errors.push(`Invalid email domain`);
      suggestions.push(`Did you mean ${localPart}@${this.commonTypos[domain]}?`);
      return { isValid: false, errors, suggestions };
    }

    // Check if domain is allowed
    if (!this.allowedDomains.includes(domain)) {
      errors.push(`Only Gmail and Outlook email addresses are allowed`);
      suggestions.push('Please use a @gmail.com or @outlook.com email address');
      return { isValid: false, errors, suggestions };
    }

    // Check domain length
    if (domain.length < 4) {
      errors.push('Invalid email domain');
    }

    // Check local part length
    if (localPart.length < 1) {
      errors.push('Invalid email username');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
      domain,
      localPart
    };
  }

  getAllowedDomains() {
    return this.allowedDomains;
  }

  isDomainAllowed(domain) {
    return this.allowedDomains.includes(domain);
  }
}

module.exports = new EmailValidationService();