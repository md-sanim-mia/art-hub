
import express from 'express'
import { ContactContllor } from './contact.contllor'

const router=express.Router()

router.post('/send-email',ContactContllor.createContact)

export const contactRoute=router