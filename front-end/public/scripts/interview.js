var Interview = React.createClass({

	getInitialState: function() {
		return {interviewdata: interviewdata}
	},

	render: function() {

		console.log(this.state.interviewdata['title'])

		return (
			<div>

				<section className="white minH bluetop">
					<div className="container">
						<h1>{this.state.interviewdata.title}</h1>
						<br />
						<br />
						<div>
							<video src="/" className="video_capture_window" controls></video>
							<textarea className="coding_capture_window" defaultValue="#include <stdlib.c>&#13;&#13;int main(int argc, char **argv)&#13;{&#13;&nbsp;&nbsp;&nbsp;&nbsp;printf('hello world\n');&#13;&#13;&nbsp;&nbsp;&nbsp;&nbsp;return 0;&#13;}"/>
						</div>

						<div className="comment_container">
							<h4>{'Comments ('+this.state.interviewdata.comments.length+')'}</h4>
							<div className="comment_box">
								
							</div>
						</div>
					</div>
				</section>
			</div>
		);
	}
});



ReactDOM.render(
  <Interview />,
  document.getElementById('interview')
);
