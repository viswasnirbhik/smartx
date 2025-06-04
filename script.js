function addMember() {
    const email = document.getElementById('member-email').value.trim();
    const familyId = auth.currentUser.uid;
    
    if (!email) {
        alert('Please enter a valid email');
        return;
    }

    // First check if user exists in Auth
    auth.fetchSignInMethodsForEmail(email)
        .then(() => {
            // Add to family members list
            return db.collection('families').doc(familyId).update({
                members: firebase.firestore.FieldValue.arrayUnion({
                    email: email,
                    role: 'member'
                })
            });
        })
        .then(() => {
            alert(`Member ${email} added successfully!`);
            document.getElementById('member-email').value = '';
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
}
