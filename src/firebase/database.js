import app from "./firebaseSetup.js"
import { getFirestore, collection, setDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage(app);
const db = getFirestore(app);

//NOTE: image field should be a File or Blob object when inserting data into database, but should be a URL when getting data.
class Post{
    constructor(author, title, description, species, image, latitude, longitude, rating=0, id=-1){
        this.author = author;
        this.title = title;
        this.description = description;
        this.species = species;
        this.image = image;
        this.latitude = latitude;
        this.longitude = longitude;
        this.rating = rating;
        this.id = id;
    }
}

class Comment{
    constructor(text, author, date, rating=0, id=-1){
        this.text = text;
        this.author=author;
        this.rating=rating;
        this.date = date;
        this.id = id;
    }
}

const postConverter = {
    toFirestore: (post) => {
        return {
                author: post.author,
                title: post.title,
                description: post.description,
                species: post.species,
                image: post.image,
                latitude: post.latitude,
                longitude: post.longitude,
                rating: post.rating,
            };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Post(data.author, data.title, data.description, data.species, data.image, data.latitude, data.longitude, data.rating, snapshot.id);
    }
};

const commentConverter ={
    toFirestore: (comment) => {
        return {
            text: comment.text,
            author: comment.author,
            rating: comment.rating,
            date: comment.date
        };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Comment(data.text, data.author, data.date, data.rating, snapshot.id);
    }
}

async function addNewPost(post){
    const newPostRef = doc(collection(db, "posts")).withConverter(postConverter);

    let imagePath = 'images/' + newPostRef.id;
    const storageRef = ref(storage, imagePath);
    await uploadBytes(storageRef, post.image);

    let imageURL = "";
    await getDownloadURL(ref(storage, imagePath))
    .then((url) => {
      imageURL = url;
    });
    
    post.image = imageURL;
    await setDoc(newPostRef,post);
}

async function addCommentToPost(comment, postId){
    const ref = doc(collection(db, 'comments/' + postId + '/comments')).withConverter(commentConverter);
    await setDoc(ref, comment);
}

async function getPostById(id){
    const ref = doc(db, "posts", id).withConverter(postConverter);
    const docSnap = await getDoc(ref);
    return docSnap.data();
}

//Returns a map of id (string) -> Post objects
async function getAllPosts(){
    const ref = collection(db, "posts").withConverter(postConverter);
    const querySnapshot = await getDocs(ref);
    let map = new Map();
    querySnapshot.forEach((doc) => {
        map.set(doc.id, doc.data());
    });
    return map;
}

async function getPostsBySpecies(species){
    const ref = collection(db, "posts").withConverter(postConverter);
    const q = query(ref, where("species", "==", species));
    const querySnapshot = await getDocs(q);
    let map = new Map();
    querySnapshot.forEach((doc) => {
        map.set(doc.id, doc.data());
    });
    return map;
}

async function getPostsByLocation(longMax, longMin, latMax, latMin){
    const ref = collection(db, "posts").withConverter(postConverter);
    const q = query(ref, where("longitude", "<=", longMax), where("longitude", ">=", longMin));
    const querySnapshot = await getDocs(q);
    let map = new Map();
    querySnapshot.forEach((doc) => {
        let currentLatitude = doc.data().latitude;
        if(currentLatitude <= latMax && currentLatitude >= latMin){
            map.set(doc.id, doc.data());
        }
    });
    return map;
}

async function getPostsBySpeciesAndLocation(species, longMax, longMin, latMax, latMin){
    const ref = collection(db, "posts").withConverter(postConverter);
    const q = query(ref, where("species", "==", species), where("longitude", "<=", longMax), where("longitude", ">=", longMin));
    const querySnapshot = await getDocs(q);
    let map = new Map();
    querySnapshot.forEach((doc) => {
        let currentLatitude = doc.data().latitude;
        if(currentLatitude <= latMax && currentLatitude >= latMin){
            map.set(doc.id, doc.data());
        }
    });
    return map;
}

async function getCommentsByPost(postId){
    const ref = collection(db, "comments/" + postId + "/comments").withConverter(commentConverter);
    const querySnapshot = await getDocs(ref);
    let map = new Map();
    querySnapshot.forEach((doc) => {
        map.set(doc.id, doc.data());
    });
    return map;
}

export {Post, Comment, addNewPost, getPostById, getAllPosts, getPostsBySpecies, getPostsByLocation, getPostsBySpeciesAndLocation, addCommentToPost, getCommentsByPost};