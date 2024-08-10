const express = require("express");
const prisma = require("../lib/prisma/index");
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../lib/middlewares/async");

/**
 * 회원가입
 */
router.post(
  `/signup`,
  asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    //bcrypt라이브러리로 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // TODO: 비밀번호 암호화 및 에러핸들링 추가
    const createdUser = await prisma.user
      .create({
        data: {
          email,
          password : hashedPassword,
        },
      })
      .catch((err) => {
        console.log(err);

        throw new CustomError(
          "Prisma Error accrued!",
          ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      });

    res.status(201).json(createdUser);
  })
);

/**
 * 로그인
 */
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: username },
      });

      if (!user) {
        return done(null, false, { message: 'Invalid email.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

router.post(`/login`, async(req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
          if (error) return res.status(500).json(error)
          if (!user) return res.status(401).json(info.message)

          req.logIn(user, (err) => {
            if (err) return next(err)
            res.redirect('/')
          })
      })(req, res, next)
})

module.exports = router;
