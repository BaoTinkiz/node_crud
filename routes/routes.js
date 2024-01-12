const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require("fs");

//image upload
var storage = multer.diskStorage({
    destination: function(req,file, cb){
        cb(null, './uploads');
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname+"_"+Date.now()+ "_" + file.originalname);
    },
});

var upload =multer({
    storage: storage,
}).single("image");

router.post('/add',upload, (req,res)=>{
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    });
    user.save()
    .then(() => {
        req.session.message = {
            type: "success",
            message: "User added successfully",
        };
        res.redirect("/");
    })
    .catch(err => {
        res.json({ message: err.message, type: 'danger' });
    });
});

router.get("/", async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render("index", {
            title: "Home Page",
            users: users,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

router.get("/add",(req, res) =>{
    res.render("add_user", {title: "Add user"})
});

// edit
router.get("/edit/:id", (req, res) => {
    let id = req.params.id;
    User.findById(id)
        .then(user => {
            if (!user) {
                res.redirect("/");
                return;
            }
            res.render("edit_user", {
                title: "Edit user",
                user: user,
            });
        })
        .catch(err => {
            console.error(err);
            res.redirect("/");
        });
});
// Update
router.post("/update/:id", upload, async (req, res) => {
    try {
        let id = req.params.id;
        let new_image;

        if (req.file) {
            new_image = req.file.filename;
            try {
                fs.unlinkSync("./uploads/"+req.body.old_image);
            } catch (err) {
                console.log(err);
            }
        } else {
            new_image = req.body.old_image;
        }

        const result = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        req.session.message = {
            type: "success",
            message: "User update successfully!",
        };

        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});

// delete
router.get('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: `User with id ${id} not found` });
        }

        // Remove the user
        const result = await User.findByIdAndDelete(id);

        // If the user has an image, delete the image file
        if (result.image !== '') {
            try {
                fs.unlinkSync(`./uploads/${result.image}`);
            } catch (err) {
                console.log(err);
            }
        }

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully',
        };

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;