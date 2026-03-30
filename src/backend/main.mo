import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Set "mo:core/Set";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  type UserProfile = {
    username : Text;
    bio : Text;
  };

  module UserProfile {
    public func compare(user1 : UserProfile, user2 : UserProfile) : Order.Order {
      Text.compare(user1.username, user2.username);
    };
  };

  type Meme = {
    id : Nat;
    author : Principal;
    authorName : Text;
    title : Text;
    tags : [Text];
    blob : Storage.ExternalBlob;
    createdAt : Int;
    likes : Nat;
  };

  module Meme {
    public func compare(meme1 : Meme, meme2 : Meme) : Order.Order {
      Int.compare(meme2.createdAt, meme1.createdAt);
    };

    public func compareByLikes(meme1 : Meme, meme2 : Meme) : Order.Order {
      Nat.compare(meme2.likes, meme1.likes);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let memes = Map.empty<Nat, Meme>();
  let memeLikes = Map.empty<Nat, Set.Set<Principal>>();
  var nextMemeId = 0;

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func upsertUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upsert user profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getAllUserProfiles() : async [UserProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all profiles");
    };
    userProfiles.values().toArray().sort();
  };

  type CreateMemeRequest = {
    title : Text;
    authorName : Text;
    tags : [Text];
    blob : Storage.ExternalBlob;
  };

  public shared ({ caller }) func createMeme(req : CreateMemeRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create memes");
    };
    let id = nextMemeId;
    nextMemeId += 1;
    let meme : Meme = {
      id;
      author = caller;
      authorName = req.authorName;
      title = req.title;
      tags = req.tags;
      blob = req.blob;
      createdAt = Time.now();
      likes = 0;
    };
    memes.add(id, meme);
    memeLikes.add(id, Set.empty<Principal>());
    id;
  };

  public query ({ caller }) func getMemeById(id : Nat) : async ?Meme {
    memes.get(id);
  };

  public query ({ caller }) func getMemes() : async [Meme] {
    memes.values().toArray().sort();
  };

  public query ({ caller }) func getMemesByUser(user : Principal) : async [Meme] {
    memes.values().filter(func(m) { m.author == user }).toArray().sort();
  };

  public shared ({ caller }) func deleteMeme(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete memes");
    };
    switch (memes.get(id)) {
      case (null) { Runtime.trap("Meme not found") };
      case (?meme) {
        if (meme.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the author or admin can delete this meme");
        };
        memes.remove(id);
        memeLikes.remove(id);
      };
    };
  };

  public shared ({ caller }) func toggleLikeMeme(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle like memes");
    };
    switch (memes.get(id), memeLikes.get(id)) {
      case (?meme, ?likes) {
        if (likes.contains(caller)) {
          likes.remove(caller);
          let updatedMeme = { meme with likes = meme.likes - 1 };
          memes.add(id, updatedMeme);
        } else {
          likes.add(caller);
          let updatedMeme = { meme with likes = meme.likes + 1 };
          memes.add(id, updatedMeme);
        };
      };
      case (_, _) { Runtime.trap("Meme not found") };
    };
  };

  public query ({ caller }) func hasLikedMeme(id : Nat) : async Bool {
    switch (memeLikes.get(id)) {
      case (?likes) { likes.contains(caller) };
      case (null) { false };
    };
  };

  public query ({ caller }) func getMostLikedMemes(limit : Nat) : async [Meme] {
    let memeArray = memes.values().toArray().sort(Meme.compareByLikes);
    memeArray.sliceToArray(0, Nat.min(limit, memeArray.size()));
  };

  public query ({ caller }) func getMemeCount() : async Nat {
    memes.size();
  };

  public query ({ caller }) func getUserMemeCount(user : Principal) : async Nat {
    var count = 0;
    memes.values().forEach(
      func(m) {
        if (m.author == user) { count += 1 };
      }
    );
    count;
  };

  public query ({ caller }) func getTotalLikes() : async Nat {
    var total = 0;
    memes.values().forEach(
      func(m) {
        total += m.likes;
      }
    );
    total;
  };

  public query ({ caller }) func getUserTotalLikes(user : Principal) : async Nat {
    var total = 0;
    memes.values().forEach(
      func(m) {
        if (m.author == user) { total += m.likes };
      }
    );
    total;
  };

  public query ({ caller }) func getTrendingTags(limit : Nat) : async [Text] {
    let tagCounts = Map.empty<Text, Nat>();
    memes.values().forEach(
      func(m) {
        m.tags.forEach(
          func(tag) {
            switch (tagCounts.get(tag)) {
              case (?count) { tagCounts.add(tag, count + 1) };
              case (null) { tagCounts.add(tag, 1) };
            };
          }
        );
      }
    );
    let tagArray = tagCounts.toArray().sort(
      func(a, b) {
        Nat.compare(b.1, a.1);
      }
    );
    tagArray.sliceToArray(0, Nat.min(limit, tagArray.size())).map(func(t) { t.0 });
  };
};
