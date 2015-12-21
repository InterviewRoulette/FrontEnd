var InterviewApp = React.createClass({
	getInitialState: function() {
		return ({currentStage: 0});
	},

	nextStage: function() {
		this.setState({currentStage: this.state.currentStage+1});
	},

	render: function() {
		switch(this.state.currentStage){
			case 0: return (<InterviewInstructions nextStage={this.nextStage}/>); break;
			case 1: return (<InterviewDetails nextStage={this.nextStage}/>); break;
			case 2: return (<InterviewReview nextStage={this.nextStage}/>); break;
			default: null;
		}
			
	}
});

var InterviewReview = React.createClass({
	render: function() {
		return (
			<section className="white bluetop minH">
				<div className="container">
				</div>
			</section>
		);
	}
});

var InterviewDetails = React.createClass({

	render: function() {
		return (
			<div>
				<section className="white bluetop">
					<div className="container">
						<h1>Choose your interview</h1>
						<br />
						<br />
						<h4>You are logged in as <span className="emph">djprof</span></h4>
						<table className="mt20">
							<tbody>
								<tr className="interview_choice">
									<td>
										<h4>Choose interview catagory:</h4> 
									</td>
									<td>
										<select>
											<option value="strings">Strings</option>
											<option value="linkedlists">LinkedLists</option>
											<option value="bitmanipulation">Bit Manipulation</option>
											<option value="random">Random</option>
										</select>
									</td>
								</tr>
								<tr className="interview_choice">
									<td>
										<h4>Choose interview language:</h4> 
									</td>
									<td>
										<select>
											<option value="python">python</option>
											<option value="C++">C++</option>
											<option value="java">java</option>
											<option value="javascript">javascript</option>
											<option value="haskell">haskell</option>

										</select>
									</td>
								</tr>
							</tbody>
						</table>

						<h4>Choose interview difficulty:</h4> 
						<div className="option_button ml70 option_button_selected">easy</div>
						<div className="option_button">medium</div>
						<div className="option_button">hard</div>
						<div className="option_button">expert</div>
						<br />
						<br />

						<h4>Choose interview length:</h4> 
						<div className="option_button ml70">15mins</div>
						<div className="option_button">30mins</div>
						<div className="option_button option_button_selected">1hour</div>
						<div className="option_button">4x1hour</div>
						<br />
						<br />

						<h4>Choose recording type:</h4> 
						<div className="option_button ml70 option_button_selected">video, audio, text</div>
						<div className="option_button">audio, text</div>
						<div className="option_button">text, only</div>
						<br />
						<br />

						<h4>Finally, enter a name for your video:</h4> 
						<input className="ml70" type="text" name="video_title" placeholder="enter video name here" />
						<br />
						<br />
						<br />
						<br />

						<div onClick={this.props.nextStage} className="button">Review Settings</div>
					</div>

				</section>
			</div>
		);
	}
});

var InterviewInstructions = React.createClass({
	render: function() {
		return (
			<div>
				<h1 className="orange mpnew">Get Started</h1>

				<section className="white minH">
					<div className="container">
						<div className="getting_started_intro">
							<div className="half half1 text_centering">
								<img src="images/get_starting_intro.png" height="250px"/>
							</div>
							<div className="half half2 mt50">
								<p className="intro_title">Ready to smash your next coding interview?</p>
								<p className="intro_text">Lets get going!</p>
							</div>
						</div>
						<OutlineTable title={"Taking Your Interview"} content={TakingInterviewOutline} />
						<OutlineTable title={"Submitting Your Interview"} content={SubmittingInterviewOutline} />
						<div className="breaker"></div>
						<h3>Ready?</h3>
						<br />
						<div className="tc">
							<div onClick={this.props.nextStage} className="button">Lets Go</div>
						</div>
					</div>
				</section>
			</div>
		);
	}
});

var OutlineTable = React.createClass({
	render: function() {
		return (
			<div>
				<div className="breaker"></div>
				<h3>{this.props.title}</h3>
				<table className="get_started_table">
					<tbody>
						{this.props.content.map(function(entry) {
							return (
								<tr>
									<td><ul><li><span>{entry.words}</span></li></ul></td>
									<td className="tc"><img src={"images/"+entry.image} /></td>
								</tr>
							);
						}, this)}
					</tbody>
				</table>
			</div>
		);
	}
});

var TakingInterviewOutline = [
	{
		words: "Before you are asked a question on screen, a timer will appear on screen",
		image: "get_starting_intro.jpg"
	},
	{
		words: "You will have an interactive whiteboard from which to code out your answer",
		image: "get_starting_intro.jpg"
	},
	{
		words: "Make sure to have some scratch paper to plan your algorithm on!",
		image: "get_starting_intro.jpg"
	},
	{
		words: "Each question will have a maximum of 3 hints you can use at will",
		image: "get_starting_intro.jpg"
	}
];

var SubmittingInterviewOutline = [
	{
		words: "Some instructions to go here...",
		image: "get_starting_intro.jpg"
	}
]

ReactDOM.render(
  <InterviewApp />,
  document.getElementById('takeinterview')
);
