export const registerSchema = {
  first_name: {
    in: ["body"],
    trim: true,
    notEmpty: {
      errorMessage: "First name is required",
    },
    isLength: {
      options: { min: 2, max: 25 },
      errorMessage: "First name must be between 2 and 25 characters",
    },
  },

  last_name: {
    in: ["body"],
    trim: true,
    notEmpty: {
      errorMessage: "Last name is required",
    },
    isLength: {
      options: { min: 2, max: 25 },
      errorMessage: "Last name must be between 2 and 25 characters",
    },
  },

  email: {
    in: ["body"],
    trim: true,
    notEmpty: {
      errorMessage: "Email is required",
    },
    isEmail: {
      errorMessage: "Must be a valid email address",
    },
    normalizeEmail: true,
  },

  password: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Password is required",
    },
    isLength: {
      options: { min: 8 },
      errorMessage: "Password must be at least 8 characters long",
    },
    matches: {
      options: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      errorMessage:
        "Password must contain uppercase, lowercase, number and special character",
    },
  },

  c_password: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Confirm password is required",
    },
    custom: {
      options: (value, { req }) => value === req.body.password,
      errorMessage: "Passwords do not match",
    },
  },
};

export const loginSchema = {
    email:{
        in:["body"],
        trim:true,
         notEmpty :{
            errorMessage:"Email is required"
         },
         normalizeEmail:true, 
    },
    password:{
        in:["body"],
        notEmpty:{
            errorMessage:"Password is required!"
        }
    }
}