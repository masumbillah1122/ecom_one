const User = require('../models/UserModel');
const ErrorHandler = require('../utils/ErrorHandler.js');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendToken = require("../utils/jwtToken.js");
const sendMail = require('../utils/sendMail.js');
const crypto = require('crypto');


// Register User
exports.createUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: 'https://test.com',
            url: 'https://test.com'
        }
    });
    sendToken(user, 200, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler('Please enter your email & password', 400));
    }
    const user = await User.findOne({email}).getQuery('+password');

    if (!user) {
        return next(new ErrorHandler('User found with this email and password', 401));
    }

    const isPasswordMatched = await user.comparePasswords(password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler('User is not found with this email and password', 401));
    }

    sendToken(user,200,res);
}); 

// Log out user
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    //Or code//
    // res.cookie("jwtToken", sendToken, {
    //   maxAge: 2 * 60 * 60 * 1000,
    //   httpOnly: true,
    // });
    
    res.status(200).json({
        success: true,
        msg:"Log out success",
    })
});

// Forgot password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  // Get ResetPassword Token

  const resetToken = user.getResetToken();

  await user.save({
    validateBeforeSave: false
  });
  
  const resetPasswordUrl = `${req.protocol}://${req.get('host')}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n${resetPasswordUrl}`;

  try {
    await sendMail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });

  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTime = undefined;

    await user.save({
      validateBeforeSave: false
    });

    return next(new ErrorHandler(error.message));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //create token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTime: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler('Reset Password url is invalid or has been expired', 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Password is not matched with the new password', 400));
  }

  user.password = req.body.password;

  user.resetPasswordToken = undefined;
  user.resetPasswordTime = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get user Details
exports.userDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// Update user password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).getQuery('+password');
  
  const isPasswordMatched = await user.comparePasswords(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Old password is incorrect', 400));
  };
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password not matched with each other", 400));
  }
  user.password = req.body.newPassword;

  await user.save();
  
  sendToken(user, 200, res);
});

// Update User Image Profile Change

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  // We add cloudinary letter then we are giving condition for the avatar
  const user = await User.findByIdAndUpdate(req.body.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });

})

// Get All Users ---Admin
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users
  });
});

// Get Single User Details ---Admin

exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User is not found with this id",400));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Change User Role ---Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  
  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });
});

// Delete User Role ---Admin
exports.deleteUserRole = catchAsyncErrors(async (req, res, next) => {
  
  // we remove cloudinary letter then we are giving condition for the avatar
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User is not found with this id", 400));
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User removed successfully"
  });
});