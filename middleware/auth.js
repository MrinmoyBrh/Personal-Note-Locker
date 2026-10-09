const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try {
            //Token format is "Bearer eyjhbGciOi..."
            token = req.headers.authorization.split(' ')[1];

            //Verify token authenticity
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //Attach user ID directly to the request object
            req.user = decoded.userId;

            //Pass control to the next function (the actual route)
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Invalid or expired token!"});
        }
    }
    if (!token){
        return res.status(401).json({ message: "Accessdenied. No tokenprovided."});
    }
};

module.exports = protect;