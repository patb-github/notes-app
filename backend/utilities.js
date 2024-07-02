import jwt from "jsonwebtoken";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    console.log(`Acess Token: ${token}`);
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        console.log("AT UTILITIES JWT.VERIFY");
        console.log(user);
        req.user = user.user;
        next();
    });
}

export { authenticateToken };