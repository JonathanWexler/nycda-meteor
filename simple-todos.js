Posts = new Mongo.Collection("posts");
Projects = new Mongo.Collection("projects");

if (Meteor.isServer) {
  // This code only runs on the server
  // Only publish posts that are public or belong to the current user
  Meteor.publish("posts", function () {
    return Posts.find({
      $or: [
      { private: {$ne: true} },
      { owner: this.userId }
      ]
    });
  });
  Meteor.publish("projects", function () {
    return Projects.find({
      $or: [
      { private: {$ne: true} },
      { owner: this.userId }
      ]
    });
  });
}

if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("posts");
  Meteor.subscribe("projects");

  Template.body.helpers({
    posts: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter posts
        return Posts.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the posts
        return Posts.find({}, {sort: {createdAt: -1}});
      }
    },
    projects: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter posts
        return Projects.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the posts
        return Projects.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    incompleteCount: function () {
      return Posts.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();

      // Get value from form element
      var gem = event.target.gem.value;
      var url = event.target.url.value;

      // Insert a task into the collection
      Meteor.call("addTask", gem, url);
      // alert("Can't wait to hear about " + gem + "!")
      // Clear form
      event.target.gem.value = "";
      event.target.url.value = "";
    },
    "submit .new-project": function (event) {
      // Prevent default browser form submit
      event.preventDefault();

      // Get value from form element
      var project = event.target.project.value;
      var url = event.target.url.value;

      // Insert a task into the collection
      Meteor.call("addProject", project, url);
      // alert("Can't wait to hear about " + gem + "!")
      // Clear form
      event.target.project.value = "";
      event.target.url.value = "";
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

Template.post.helpers({
  isOwner: function () {
    return (this.owner === Meteor.userId() || Meteor.user().username.toUpperCase() === "Jon".toUpperCase());
  },
  isJon: function () {
    return (Meteor.user().username.toUpperCase() === "Jon".toUpperCase());
  }
});
Template.project.helpers({
  isOwner: function () {
    return (this.owner === Meteor.userId() || Meteor.user().username.toUpperCase() === "Jon".toUpperCase());
  }
});
Template.post.events({
  "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

Template.project.events({
  "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteProject", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

}

Meteor.methods({
  addTask: function (gem, url) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Posts.insert({
      gem: gem,
      url: url,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  addProject: function (project, url) {
    console.log("ADDING");
    // Make sure the user is logged in before inserting a project
    if (! Meteor.userId()) {
      console.log("NOT ADD");
      throw new Meteor.Error("not-authorized");
    }
    Projects.insert({
      project: project,
      url: url,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
    console.log("SUCCESS: " + project);
  },
  deleteTask: function (taskId) {
    var task = Posts.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Posts.remove(taskId);
  },
  deleteProject: function (taskId) {
    var task = Projects.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Projects.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    var task = Posts.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }

    Posts.update(taskId, { $set: { checked: setChecked} });
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Posts.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Posts.update(taskId, { $set: { private: setToPrivate } });
  }
});
