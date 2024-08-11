const fs = require("fs");

fs.readFile("all_product.js", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const cleanedData = data.replace(/\u2028|\u2029/g, ""); // Remove LS and PS characters
  fs.writeFile("all_product.js", cleanedData, "utf8", (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("File cleaned successfully.");
  });
});
