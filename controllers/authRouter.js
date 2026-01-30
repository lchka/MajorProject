import dotenv from "dotenv"
import express from "express"
import User from "../models/User"
import path from "path"
import fs from "fs"
import { HttpError,
    BAD_REQUEST,
    CREATED_SUCCESS
 } from "../utils/HttpError"