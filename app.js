const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const formidable = require('formidable');
 

const app = express();

// Middleware

// app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
  }));
app.use(passport.initialize());
app.use(passport.session());



// // Mongo URI //using MLabs
const url='mongodb+srv://sujith4488:sujith1234@@cluster0-b4qca.mongodb.net/Hostel';
const tempUrl='mongodb://localhost:27017/Hostel';

mongoose.connect(tempUrl,{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);



const picSchema = new mongoose.Schema({
img:String
});

const HostelSchema=new mongoose.Schema({
	blockName:String,
	roomNo:Number,
	roll:{
		type:String,
		unique:true
	},
	name:String,
	gender:String,
	guardian:String,
	img:String

});


const AttdSchema=new mongoose.Schema({
	date:{
		type:String,
		unique:true
	},
	present:[] 
});

const IssueSchema=new mongoose.Schema({
	roll:String,
	blockName:String,
	room:Number,
	issue:String
});

const Hostel=mongoose.model("Hostel",HostelSchema);

const Attd=mongoose.model("Attd",AttdSchema);

const Issue=mongoose.model("issue",IssueSchema);


const AdminSchema = new mongoose.Schema({
	username:String,
	password:String
});

AdminSchema.plugin(passportLocalMongoose);


const Pic = mongoose.model("Pic",picSchema);


const Admin = mongoose.model("Admin",AdminSchema);
passport.use(Admin.createStrategy());

passport.serializeUser(function(user, done) {
	done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
	Admin.findById(id, function(err, user) {
	  done(err, user);
	});
  });



app.post("/img/:roll", function(req,res){
	var form = new formidable.IncomingForm();
	form.parse(req);
	form.on('fileBegin',function(name,file){
	file.path =__dirname +'/public/'+req.params.roll+".jpg";
		
	});
	
	

	res.redirect("/dashboard");
});





app.get("/delIssue/:id",function(req,res){

		Issue.findByIdAndRemove(req.params.id,function(err){
		if(err){
			console.log(err);
			res.render("result",{success:false,msg:"Server Error please try again"});
		} else{
			
			res.redirect("/issues");
		}
	});
});

app.get("/issues",function(req,res){
	Issue.find({},function(err,data){
		if(err){
			console.log(err);
			res.render("result",{success:false,msg:"Server Error please try again"});			
		} else{
			res.render("issues",{data:data});
		}
	});
});


app.get("/attdrange/:date",function(req,res){
	var date=req.params.date;
	Attd.find({date:date}).sort({roll:'ascending'}).exec(function(err,data){
		if(err){
			console.log(err);
			res.render("result",{success:false,msg:"Server Error please try again"});
		} else{

			Hostel.find({}).sort({roomNo:'ascending'}).exec(function(err,info){
				if(err){
					console.log(err);
					res.render("result",{success:false,msg:"Server Error please try again"});
				} else{
					//console.log(info);
					res.render("attdrange",{data:data,info:info,date:date});
				}
			});


			
		}
	});
});


app.post("/addattd",function(req,res){

	var present=[];
	Hostel.find({}).sort({roll: 'ascending'}).exec(function(err, data){

		if(err){
			console.log(err);
			res.render("result",{success:false,msg:"Server Error please try again"});
		} else{

			//console.log(req.body[data[0].roll]);
			
			for(var i=0;i<data.length;i++){
				if(req.body[data[i].roll]){
					//console.log(data[i].roll);
					present.push(data[i].roll);
				}
			}
			const attd=new Attd({
				date:req.body.date,
				present:present
			});
			//console.log(req.body.date);
			attd.save(function(err,data){
				if(err){
					res.render("result",{success:false,msg:"Attendance already taken"});
				} else{
					res.render("result",{success:true,msg:"Attendance updated successfully"});
				}
			});
			
		}
	});
	
});


app.get("/addattd",function(req,res){
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); 
	var yyyy = today.getFullYear();
	today = yyyy+"-"+mm+"-"+dd;

	Hostel.find({}).sort({"roll": 'ascending'}).exec(function(err, data){

		if(err){
			console.log(err);
			res.render("result",{success:false,msg:"Server Error please try again"});
		} else{

			res.render("addattd",{today:today,data:data});
		}
	});
	

});


app.post("/attd",function(req,res){

	var prsnt=[];
	var start=req.body.start;
	var end=req.body.end;

	if(start>end){
		res.render("result",{success:false,msg:"Date range invalid"});
	} else{

		Attd.find({}).sort({date:'ascending'}).exec(function(err,data){
			if(err){
				console.log(err);
				res.render("result",{success:false,msg:"Server Error please try again"});			
			} else{
				for(var i=0;i<data.length;i++){
					if (data[i].date>=start && data[i].date<=end){
						prsnt.push(data[i]);
					}
				}

				res.render("attd",{show:true,data:prsnt});
			}
		})

	}
});

app.get("/attd",function(req,res){

	res.render("attd",{show:false});

});







app.get("/del/:delItem/:num/:room",function(req,res){

	const delItem=req.params.delItem;
	// const path1=req.params.path[0];
	const num=req.params.num;
	const room=req.params.room;

		Hostel.findByIdAndRemove(delItem,function(err){
		if(err){
			console.log(err);
			res.render("result",{success:false,msg:"Server Error please try again"});
		} else{
			
			res.redirect("/Block/"+num+"/"+room);
		
		}
	});
	});



app.get("/Block/:num/:room",function(req,res){
	var num="Block-"+req.params.num;
	var room=req.params.room;
	// console.log(num);
	// console.log(room);
		Hostel.find({$and:[{blockName:num},{roomNo:room}]}).sort({roll: 'ascending'}).exec(function(err, data){
			if(err){
				console.log(err);
				res.render("result",{success:false,msg:"Server Error please try again"});
			} else{
				//console.log(data);
				res.render("roomStudents",{data:data,num:req.params.num,room:room});
			}
		});

});

app.get("/blocks/:num",function(req,res){
	var num=req.params.num;
	Hostel.find({blockName:num},function(err,data){
		if(err){
			res.render("result",{success:false,msg:"Server Error please try again"});
		} else{
			res.render("rooms",{blockNum:num,data:data});
		}

	});
});



app.get("/hostels",function(req,res){
	res.render("hostels");	
});	




app.post("/students",function(req,res){

	const find=req.body.search.toLowerCase();
	//console.log(find[0]);
	if (find[0]==="1"){
		Hostel.find({roll:find},function(err,data){
			if(err){
				console.log(err);
				res.render("result",{success:false,msg:"Server Error please try again"});
			} else{
				// console.log("roll");
				// console.log(data);
				res.render("students",{data:data});
			}
		});
	} else{

		
		Hostel.find({name:find}).sort({roll: 'ascending'}).exec(function(err, data){
			if(err){
				console.log(err);
				res.render("result",{success:false,msg:"Server Error please try again"});
			} else{
				// console.log("name");
				// console.log(data);
				res.render("students",{data:data});
			}
		});
	}

});


app.post("/add",function(req,res){
	
	console.log(req.body);
	// var form = new formidable.IncomingForm();
	// //form.parse(req);
	// form.on('fileBegin',function(name,file){
	// 	file.path =__dirname +'/public/'+req.body.roll;
	// 	console.log(file.path);
	// });
	// form.on('file',function(name,file){
	// 	console.log("Uploaded file",file.name);
	// })


	const data=new Hostel({
		blockName:req.body.blockName,
		roomNo:req.body.roomNo,
		roll:req.body.roll.toLowerCase(),
		name:req.body.name.toLowerCase(),
		gender:req.body.gender,
		guardian:req.body.guardian,
		img:""
		
	});	

	data.save(function(err,data){
		if(err){
			res.render("result",{success:false,msg:"Student with your Roll No. already exists"});
		} else{
			var numm="";
			for(var i=0;i<req.body.blockName.length;i++){
				if(i>5){
					numm+=req.body.blockName[i];
				}
			}
			//console.log("/Block/"+numm+"/"+req.body.roomNo);
			res.render("pic",{id:req.body.roll.toLowerCase()});
			
		}
	});
	

});

app.get("/add/:num/:room",function(req,res){
	var num="Block-"+req.params.num;
	var room=req.params.room;
	// console.log(num);
	// console.log(room)

	Hostel.countDocuments({roomNo:room,blockName:num},function(err,cnt){
		if(err){
				console.log(err);
				res.render("result",{success:false,msg:"Server Error please try again"});
		} else{
			if(cnt<5){
				res.render("add",{num:num,room:room});
			} else{
				res.render("result",{success:false,msg:"The room is already full, cant add more students"});
			}
		}
	});

	
});




app.get("/dashboard",function(req,res){

	console.log(req.user.user);
	Admin.findOne({username:req.user.username}, function(err,found){
		if(err){
		   
			res.redirect("/");
		} else {

			if(found){
		//var students;
		Hostel.countDocuments({},function(err,cnt){
			//console.log(cnt);
			//students=cnt;
		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0'); 
		var yyyy = today.getFullYear();
		today = yyyy+"-"+mm+"-"+dd;

			Attd.find({date:today},function(err,data){
				if(err){
					console.log(err);
					res.render("result",{success:false,msg:"Server Error please try again"});
				} else{
					if(data.length===0){
						res.render("dashboard",{students:cnt,present:0});
					} else{
						res.render("dashboard",{students:cnt,present:data[0].present.length});
				}
				}
			});

			
		});
	}
}
	
});
});


app.get("/logout",function(req,res){
	req.logout();
    res.redirect("/");

});


app.post("/login",function(req,res){
	const user= new Admin({
        username: req.body.username,
        password: req.body.password
	});
	console.log(user);
	req.login(user, function(err){
		
        if(err){
        console.log(err);
        } else {
			passport.authenticate("local")(req,res,function(){
            res.redirect("/dashboard");
        });
        }
    });

 // 	Admin.register({username: req.body.username},req.body.passord,function(err,user){
	// 	if(err){
	// 		console.log(err);
	// 		res.redirect("/");
	// 	} else {
	// 		passport.authenticate("local")(req,res,function(){
	// 			res.redirect("/dashboard");
	// 		});
	// 	}
	// });

});


app.get("/id-card",function(req,res){
	res.render("idCard");
})

app.post("/id-card",function(req,res){
	var r = req.body.roll;
	Hostel.find({roll:r},function(err,user){
		if(err){
			console.log(err);
		} else{
			console.log(user);
			res.render("displayID",{id:user});
		}
	})

})

app.get("/",function(req,res){


	res.render("login");
});


let port=process.env.PORT;
if(port==null || port==""){
  port=3000;
}

app.listen(port, () => console.log(`Server started on port ${port}`));