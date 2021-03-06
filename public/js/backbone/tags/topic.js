(function($){
window.Topic = Backbone.Model
		.extend({

			defaults : function() {
				return {
					title : "",
					date : null,
					site : "",
					lang : "zh-CN",
					body : "",
					img : null,
					nation : "",
					id : "",
					key :null,
					posts : null,
					postLoaded : false,
					postShowed : false,
					read : false,
					replied : false
				};
			},

			// Toggle the `done` state of this todo item.
			loadposts : function() {
				if (this.posts != undefined) {
					return;
				} else {
					this.posts = new PostList;
				}

				var data = {
						topic : this.id
				};
				var posts = this.posts;
				var topic = this;
				$.ajax({
							url : 'tag/ajaxgetposts',
							dataType : 'json',
							data : data,
							success : function(data) {
								//TODO: translate
								var i = 0;
								data.forEach(function(row) {
											var d = row.value.date;
											var post = new Post(
													{
														body : row.value.body,
														id : encodeURIComponent(row.id),
														topicId : encodeURIComponent(row.key[0]),
														date : row.value.date,
														index : i,
														author : row.value.author,
														username : row.value.userName,
														profile_img_path : row.value.profile_img_path,
														display : row.value.display
													});
											i++;
											posts.add(post);
										});
								topic.set("postLoaded", true);
								topic.set("read", true);
							}
						});
			}

		});

window.TopicList = Backbone.Collection.extend({

	// Reference to this collection's model.
	model : Topic,

	done : function() {
	}

});

window.topics = new TopicList;

window.ContainerView = Backbone.View.extend({
	tagName : "div",
	
	className: "span11 topics isotope",

	// Cache the template function for a single item.
	template : _.template($('#container_template').html()),

	// The DOM events specific to an item.
	events : {
//		"click .title" : "toggle",
//		"click .add-url" : "addSourceUrl",
//		"click .weibo-reply-img" : "saveReply"
	},

	// The TodoView listens for changes to its model, re-rendering.
	initialize : function() {
//		this.model.bind("change:postLoaded", this.afterPostLoaded, this);
		//this.model.bind('change', this.render, this);
		//this.model.bind('destroy', this.remove, this);
	},

	// Re-render the contents of the todo item.
	render : function() {
		$(this.el).html(this.template());
		return this;
	},
	
	layout : function(){
		$(this.el).isotope({
			  itemSelector : '.topic',
			  filter: '*'
			});
	},
	
	relayout : function(){
		$(this.el).isotope("reLayout");
	}
});

window.TopicView = Backbone.View.extend({

	//... is a list tag.
	//tagName : "li",

	display : "none",

	// Cache the template function for a single item.
	template : _.template($('#topic_template').html()),

	// The DOM events specific to an item.
	events : {
		"click .title" : "toggle",
		"click .add-url" : "addSourceUrl",
	//	"click .reply_btn" : "sendReply",
		"click .reply_window" : "open_reply_window",
	},

	// The TodoView listens for changes to its model, re-rendering.
	initialize : function() {
		this.model.bind("change:postLoaded", this.afterPostLoaded, this);
		this.model.bind("change:read", this.markAsRead, this);
		this.model.bind("change:replied", this.markAsReplied, this);
		//this.model.bind('change', this.render, this);
		//this.model.bind('destroy', this.remove, this);
	},

	// Re-render the contents of the todo item.
	render : function() {
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},

	toggle : function() {
		//this.model.displayPost = "loading";
		if(!this.model.get("postShowed")){
			this.model.set("postShowed",true);
			if (!this.model.get("postLoaded")) {
				$(".posts", this.$el).html("Loading...");
				this.model.loadposts();
			}
			$(".topicPRR", this.$el).show();
//			$('.topic',this.$el).removeClass("span4");
//			$('.topic',this.$el).addClass("span61");
			if (Sns.isSns(this.model.id)) {
				$("#reply_box_1", this.$el).show();
			} else {
				$("#reply_box_1", this.$el).hide();
			}

			this.resizeTopicDiv(100);
		} else {
			this.model.set("postShowed",false);
			$(".topicPRR", this.$el).hide();
			this.resizeTopicDiv(100);
		}
		App.container.relayout();

	},

	afterPostLoaded : function() {
		var posts = this.model.posts;
		var view = new PostsView({
			model : {
				models : posts.models
			}
		});
		$(".posts", this.$el).html(view.render().el);
		App.container.relayout();

	},

	markAsRead : function(){
		if(this.model.get("read"))
			jQuery(this.el).find(".topic").addClass("read");
	},
	
	markAsReplied :function(){
		if(this.model.get("replied"))
			jQuery(this.el).find(".topic").addClass("replied");
	},
	
	resizeTopicDiv : function(adjust) {
		var ll = 250;
		if (adjust) {
			ll += adjust;
		}
		$('.topics>div').each(function(i, e) {
			ll += $(e).height() + 3;
			if ($.browser.webkit) {
				ll += 4;
			}
		});
		$('.topics').css("height", ll);
	},
	
	addSourceUrl : function(e){
		$(this.el).find(".reply-content").val($(this.el).find(".reply-content").val()+'\r\n http://'+this.model.id);
	},
	
	sendReply: function(e){
		sns = new Sns(this.model.id);
		var source = sns.getType();
		var source_id = sns.getSourceId();
		var user_id = sns.getUserId();
		var source_type = sns.getSourceType();
		
		var data = {
			source: source, 
			source_id: source_id, 
			user_id: user_id, 
			source_type: source_type, 
			content: $(this.el).find(".reply-content").val()
		};
		
		$.ajax({
			type: "POST",
			url: 'sns/comments',
			data: data,
			success: function(data){
								 if(data['status' == 1]){
									 alert("回复成功");
								 }else{
								 	 var id = "<?php echo $id; ?>";
								 	 requestToken(source, "localhost:4000", id);							 
								 }
							 }
		 });						
	},
	
	open_reply_window: function(e){
		$(".modal").modal("show");	
		$("#reply").attr("data", this.model.id);
		$("#text").val($("#image_uri").attr("uri"));
		$("#reply").text("懂了，去回复").die().live('click', function(){
//			if($("#reply").text() === "已完成回复"){
				
					
//				var jqxhr = $.post('tag/complete', {topic_uri: $("#reply").attr("data")}, function(data){
//					
//				})
//				.success(function() { $(".modal").modal("hide"); $("#reply").text("懂了，去回复");})
//    		.error(function() {  });    		
//			} else {
				var uri = $(this).attr("data");
				if(Sns.isSns(uri)){
					var sns = new Sns(uri);
					uri = sns.getSinglePage();
				}else{
					uri = "http://"+uri;
				}
				window.open(uri, '_blank');
				$("#reply").text("已完成回复");
				$("#reply").die().live('click', function(){
					$.ajax({
						type : "POST",
						url : 'tag/complete',
						dataType : 'json',
						accepts :"json",
						data : {topic_uri: $("#reply").attr("data")},
						success : function(data) {
							$(".modal").modal("hide");
						}
					});
				});
//			}
		});
	},

});

})(jQuery);