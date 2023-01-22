
function generateUniqueTnxRef () {
    const timestamp = new Date().getTime(); // Get current timestamp
    let result = timestamp.toString(); // Convert timestamp to string
    result = result.substring(result.length - 15); // Trim to 15 characters
    // Add random alphanumeric characters to the end to ensure uniqueness
    result = generateRandomString(5) + result;
    return result;
}

const  generateRandomString = (length)=>{
    const characters = 'IJKLMNOUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDE'
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
// const str = generateUniqueTnxRef()
// console.log(str);



module.exports = {generateUniqueTnxRef }
