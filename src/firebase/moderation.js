import app from "./firebaseSetup.js"
import { getFirestore, doc, updateDoc, getDoc} from "firebase/firestore"; 
import { getUserProfileStatistics } from "./database.js";
import { getUsername } from "./account.js";
const db = getFirestore(app);

var profile;

async function isUserModerator(){
    if(profile === undefined){
        let username = await getUsername();
        profile = await getUserProfileStatistics(username);
    }
    return profile.isModerator;
}

async function pinSpeciesIdentification(postId, speciesIdentificationId){
    const speciesIdentificationRef = doc(db, "species_identification", postId);
    await updateDoc(speciesIdentificationRef,{
        pinnedspeciesidentification: speciesIdentificationId,
    });
}

async function setStatus(postId, status){
    const speciesIdentificationRef = doc(db, "species_identification", postId);
    await updateDoc(speciesIdentificationRef,{
        status: status,
    });
}

async function getSpeciesIdentificationPostMetaData(postId){
    const speciesIdentificationRef = doc(db, "species_identification", postId);
    const docSnap = await getDoc(speciesIdentificationRef);
    return docSnap.data();
}

export{isUserModerator, pinSpeciesIdentification, setStatus, getSpeciesIdentificationPostMetaData}
