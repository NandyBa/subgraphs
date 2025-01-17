import { toDate } from "../utils";

interface WarningProps {
  warningArray: {
    message: string;
    type: String;
  }[]
}
// The warning display function takes the warning object passed in and creates the elements/messages to be rendered
export const WarningDisplay = ({ warningArray }: WarningProps) => {
  const warningMsgs = [];
  let warningTotalCount = 0;
  let warningDisplayCount = 0;

  if (warningArray.length > 0) {
    warningTotalCount += warningArray.length;
    for (let x = 0; x < warningArray.length; x++) {
      let warningMsg = warningArray[x].message;
      if (warningArray[x].type === "SUM") {
        warningMsg =
          "All values in " + warningArray[x].message + " are zero. Verify that this data is being mapped correctly.";
      }
      if (warningArray[x].type === "CUMULATIVE") {
        warningMsg =
          "Cumulative value in field " +
          warningArray[x].message.split("++")[0] +
          " dropped on " +
          toDate(parseFloat(warningArray[x].message.split("++")[1])) +
          ". Cumulative values should always increase.";
      }
      if (warningArray[x].type === "TVL-") {
        warningMsg = "totalValueLockedUSD on " + warningArray[x].message + " is below 1000. This is likely erroneous.";
      }
      if (warningArray[x].type === "TVL+") {
        warningMsg =
          "totalValueLockedUSD on " +
          warningArray[x].message +
          " is above 1,000,000,000,000. This is likely erroneous.";
      }
      if (warningArray[x].type === 'DEC') {
        const decInfo = warningArray[x].message.split('-');
        warningMsg = "Decimals on " + decInfo[1] + ' [' + decInfo[2] + '] could not be pulled. The default decimal value of 18 ha been applied.';
      }
      warningDisplayCount += 1;
      warningMsgs.push(<li>{warningMsg}</li>);
    }
  }

  if (warningMsgs.length >= 1) {
    return (
      <div
        style={{
          margin: "4px 24px",
          border: "yellow 3px solid",
          paddingLeft: "8px",
          maxHeight: "230px",
          overflow: "scroll",
        }}
      >
        <h3>
          DISPLAYING {warningDisplayCount} OUT OF {warningTotalCount} WARNINGS.
        </h3>
        <ol>{warningMsgs}</ol>
      </div>
    );
  } else {
    return null;
  }
}

export default WarningDisplay;