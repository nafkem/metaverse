export const validateUsername = (username: string) => {
  if (!username || typeof username !== 'string') {
    return {
      isValid: false,
      error: 'Username must be a string'
    };
  }

  const trimmedUsername = username.trim();
  
  if (trimmedUsername.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long'
    };
  }

  if (trimmedUsername.length > 30) {
    return {
      isValid: false,
      error: 'Username cannot exceed 30 characters'
    };
  }

  // Additional check for valid characters if needed
  const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validUsernameRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores and hyphens'
    };
  }

  return {
    isValid: true,
    value: trimmedUsername
  };
};


export const validateWalletId = (walletId: string) => {
  if (!walletId || typeof walletId !== 'string') {
    return {
      isValid: false,
      error: 'Wallet ID must be a string'
    };
  }

  const trimmedWalletId = walletId.trim();

  // Check for empty wallet ID after trimming
  if (trimmedWalletId.length === 0) {
    return {
      isValid: false,
      error: 'Wallet ID cannot be empty'
    };
  }

  // Validate wallet ID format (assuming Ethereum-style addresses)
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!walletRegex.test(trimmedWalletId)) {
    return {
      isValid: false,
      error: 'Invalid wallet ID format'
    };
  }

  return {
    isValid: true,
    value: trimmedWalletId
  };
};
