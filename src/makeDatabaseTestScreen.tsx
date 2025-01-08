import {
  ScreenView,
  ScrollView,
  StyledButton,
  StyledText,
  StyledView,
} from "@dwidge/components-rnw";
import { ApiHooks, ApiRecord } from "@dwidge/crud-api-react";
import { StyledHeader } from "./StyledHeader.js";

export const makeDatabaseTestScreen = <T extends ApiRecord>({
  title = "TestItem",
  useApi = () => ({}) as ApiHooks<T>,
  useNavAction = () => (filter: Partial<T>) => {},
  useNavFilter = () => ({}) as Partial<T>,
  randItem = () => ({}) as Partial<T>,
} = {}) => {
  const ListScreen = ({}) => (
    <ScreenView>
      <ScrollView>
        <StyledHeader title={title} />
        <StyledView pad gap>
          <ListView />
        </StyledView>
      </ScrollView>
    </ScreenView>
  );

  const ItemScreen = ({ filter = useNavFilter() }) => (
    <ScreenView>
      <ScrollView>
        <StyledHeader title={title} />
        <StyledView pad gap>
          <ItemView />
        </StyledView>
      </ScrollView>
    </ScreenView>
  );

  const ListView = <T,>({
    list = useApi().useGetList({}),
    createItem = useApi().useCreateItem(),
    deleteItem = useApi().useDeleteItem(),
    onPressItem = useNavAction(),
  }) => (
    <StyledView gap>
      {list?.map((item) => (
        <StyledView key={"" + item.id} row space>
          <StyledText flex onPress={() => onPressItem(item)}>
            {item.id}
          </StyledText>
          <StyledButton onPress={deleteItem && (() => deleteItem(item))}>
            Delete
          </StyledButton>
        </StyledView>
      ))}
      <StyledButton
        onPress={createItem ? () => createItem(randItem()) : undefined}
      >
        Add
      </StyledButton>
    </StyledView>
  );

  const ItemView = ({
    item: [item, setItem] = useApi().useItem(useNavFilter()),
  }) => (
    <StyledView>
      {item ? (
        <StyledText numberOfLines={111}>
          {JSON.stringify(item, null, 2)}
        </StyledText>
      ) : (
        <StyledText>Not Found</StyledText>
      )}
      <StyledButton onPress={setItem && (() => setItem(randItem()))}>
        Random
      </StyledButton>
      <StyledButton onPress={setItem && (() => setItem(null))}>
        Delete
      </StyledButton>
    </StyledView>
  );

  return { ListScreen, ItemScreen };
};
