require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false } : (process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false)
});
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({limit:'50kb'}));
app.use(express.static(path.join(__dirname,'public')));

const venueSeeds = [
 {name:'كافيه فيوليت',rating:4.7,location:'الفيوم',category:'كافيه',tags:['عيد ميلاد','أصحاب'],capacity:20,price:1000},
 {name:'قاعة جاردن',rating:4.8,location:'6 أكتوبر · الجيزة',category:'قاعة خاصة',tags:['تخرج','احتفال عائلي'],capacity:60,price:2500},
 {name:'مطعم ذا جاردن',rating:4.5,location:'الفيوم',category:'مطعم',tags:['عيد ميلاد','أصحاب'],capacity:30,price:1200},
 {name:'كافيه لونا',rating:4.9,location:'الفيوم · القاهرة',category:'كافيه',tags:['خروجة عائلية','احتفال عائلي'],capacity:25,price:800}
];

async function initializeDatabase(){
 if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Add PostgreSQL database URL in Render Environment Variables.');
 await pool.query(`
  CREATE TABLE IF NOT EXISTS venues (
   id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, rating NUMERIC(2,1) NOT NULL DEFAULT 0,
   location TEXT NOT NULL, category TEXT NOT NULL, tags TEXT[] NOT NULL DEFAULT '{}',
   capacity INTEGER NOT NULL DEFAULT 10, price INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS bookings (
   id BIGSERIAL PRIMARY KEY, venue_name TEXT NOT NULL, occasion TEXT NOT NULL,
   booking_date DATE NOT NULL, booking_time TIME NOT NULL, guests INTEGER NOT NULL,
   customer_name TEXT NOT NULL, phone TEXT NOT NULL, notes TEXT DEFAULT '',
   status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled')),
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
 `);
 for(const v of venueSeeds){
  await pool.query(`INSERT INTO venues(name,rating,location,category,tags,capacity,price)
    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(name) DO NOTHING`,
    [v.name,v.rating,v.location,v.category,v.tags,v.capacity,v.price]);
 }
}
const valid=(v)=>typeof v==='string' && v.trim().length>0;

app.get('/api/health',(req,res)=>res.json({status:'ok',service:'MAHGOOZ'}));
app.get('/api/venues',async(req,res)=>{
 try{
  const {rows}=await pool.query('SELECT * FROM venues WHERE active=true ORDER BY id');
  res.json(rows);
 }catch(e){console.error(e);res.status(500).json({error:'تعذر تحميل الأماكن'})}
});
app.post('/api/bookings',async(req,res)=>{
 const b=req.body||{};
 if(!valid(b.venueName)||!valid(b.occasion)||!valid(b.date)||!valid(b.time)||
    !Number.isInteger(b.guests)||b.guests<1||b.guests>500||
    !valid(b.customerName)||!valid(b.phone)){
  return res.status(400).json({error:'من فضلك أكمل بيانات الحجز بشكل صحيح'});
 }
 const date=new Date(`${b.date}T00:00:00`);
 if(Number.isNaN(date.getTime()) || b.date < new Date().toISOString().slice(0,10))
  return res.status(400).json({error:'اختار تاريخ اليوم أو تاريخ قادم'});
 try{
  const {rows}=await pool.query(`INSERT INTO bookings
   (venue_name,occasion,booking_date,booking_time,guests,customer_name,phone,notes)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
   [b.venueName.trim(),b.occasion.trim(),b.date,b.time,b.guests,b.customerName.trim(),b.phone.trim(),(b.notes||'').trim()]);
  res.status(201).json({message:'تم إرسال طلب الحجز',bookingId:rows[0].id});
 }catch(e){console.error(e);res.status(500).json({error:'حدث خطأ أثناء حفظ الحجز'})}
});

// Admin API is protected by a secret key stored in Render environment variables.
function adminAuth(req,res,next){
 const key=req.headers['x-admin-key'];
 if(!process.env.ADMIN_KEY || key!==process.env.ADMIN_KEY) return res.status(401).json({error:'غير مصرح'});
 next();
}
app.get('/api/admin/bookings',adminAuth,async(req,res)=>{
 try{const {rows}=await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');res.json(rows)}
 catch(e){console.error(e);res.status(500).json({error:'تعذر تحميل الحجوزات'})}
});
app.patch('/api/admin/bookings/:id',adminAuth,async(req,res)=>{
 const status=req.body?.status;
 if(!['pending','confirmed','cancelled'].includes(status)) return res.status(400).json({error:'حالة غير صحيحة'});
 try{const {rows}=await pool.query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);
 if(!rows.length)return res.status(404).json({error:'الحجز غير موجود'});
 res.json(rows[0]);}catch(e){console.error(e);res.status(500).json({error:'تعذر تعديل الحجز'})}
});
app.get('/admin', (req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));

initializeDatabase().then(()=>{
 app.listen(PORT,()=>console.log(`MAHGOOZ server listening on ${PORT}`));
}).catch(err=>{console.error('Database initialization failed:',err);process.exit(1)});
