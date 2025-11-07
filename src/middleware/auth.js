const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET_KEY || 'YourSuperSecretKeyThatIsAtLeast32CharactersLong!';
const jwtIssuer = process.env.JWT_ISSUER || 'PdfPortal';
const jwtAudience = process.env.JWT_AUDIENCE || 'PdfPortalUsers';

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: jwtIssuer,
      audience: jwtAudience
    });

    // Attach user info to request
    req.user = {
      userId: parseInt(decoded.userId),
      email: decoded.email,
      role: decoded.role
    };

    console.log(`[Auth] User authenticated: ${decoded.email}, Role: ${decoded.role}, UserId: ${decoded.userId}`);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user has specific role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`[Auth] ❌ Authorization failed: User role '${req.user.role}' not in allowed roles: [${roles.join(', ')}]`);
      return res.status(403).json({ 
        message: 'Forbidden: Insufficient permissions',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }

    console.log(`[Auth] ✅ Authorization passed: User role '${req.user.role}' is authorized`);
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

