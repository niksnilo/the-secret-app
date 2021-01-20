//jshint esversion: 6

exports.getYear = function () {
  //0-6 = Sunday-Saturday
  const year = new Date();
  const options = {
    year: "numeric",
  };

  return year.toLocaleDateString("en-US", options);
  // let dayName = today.toLocaleDateString("en-US", { weekday: "long" });
};